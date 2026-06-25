import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { generateSecret, generateURI, verifySync } from 'otplib';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { generateMemberCode } from '../common/member-code.util';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';

const SALT_ROUNDS = 10;
// Toleransi waktu verifikasi TOTP (detik) — menutup jeda ketik & selisih jam.
const TOTP_TOLERANCE = 30;
// Umur "tiket" antara login (password benar) dan input kode 2FA.
const TWO_FA_TICKET_TTL = '5m';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const phone = dto.phone?.trim() || null;

    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) {
      throw new ConflictException('Email sudah terdaftar');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    try {
      const { user, member } = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name: dto.name.trim(),
            email,
            phone,
            passwordHash,
            role: Role.CUSTOMER,
          },
        });

        // ── Klaim member ──────────────────────────────────────────────────
        // Kalau ada Member dari POS dengan phone sama & belum punya akun,
        // sambungkan ke user ini supaya poin lama kebawa. Kalau tidak ada,
        // buat member baru kosong.
        const existingMember = phone
          ? await tx.member.findUnique({ where: { phone } })
          : null;

        let member;
        if (existingMember && !existingMember.userId) {
          member = await tx.member.update({
            where: { id: existingMember.id },
            data: {
              userId: user.id,
              name: existingMember.name ?? dto.name.trim(),
            },
          });
        } else if (!existingMember) {
          member = await tx.member.create({
            data: {
              memberCode: generateMemberCode(),
              name: dto.name.trim(),
              phone,
              userId: user.id,
            },
          });
        } else {
          // phone sudah dipakai member milik user lain → buat member tanpa phone
          member = await tx.member.create({
            data: {
              memberCode: generateMemberCode(),
              name: dto.name.trim(),
              userId: user.id,
            },
          });
        }

        return { user, member };
      });

      return this.buildAuthResponse(user.id, user.email ?? '', user.role, {
        name: user.name,
        memberCode: member.memberCode,
        pointBalance: member.pointBalance,
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        // unique conflict (mis. phone sudah dipakai user lain)
        throw new ConflictException('Email atau nomor HP sudah dipakai');
      }
      throw err;
    }
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { member: true },
    });
    if (!user) {
      throw new UnauthorizedException('Email atau password salah');
    }

    // User yang daftar lewat OTP tidak punya passwordHash → tak bisa login password.
    if (!user.passwordHash) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Email atau password salah');
    }

    // Password benar tapi 2FA aktif → belum kasih access_token. Terbitkan tiket
    // singkat; user harus tukar dengan kode TOTP di /auth/2fa/login.
    if (user.twoFactorEnabled) {
      const twoFactorToken = await this.jwt.signAsync(
        { sub: user.id, twofa: true },
        { expiresIn: TWO_FA_TICKET_TTL },
      );
      return { twoFactorRequired: true as const, twoFactorToken };
    }

    return this.buildAuthResponse(user.id, user.email ?? '', user.role, {
      name: user.name,
      memberCode: user.member?.memberCode ?? null,
      pointBalance: user.member?.pointBalance ?? null,
    });
  }

  // Tukar tiket 2FA + kode TOTP jadi access_token penuh.
  async loginTwoFactor(twoFactorToken: string, code: string) {
    let payload: { sub?: string; twofa?: boolean };
    try {
      payload = await this.jwt.verifyAsync(twoFactorToken);
    } catch {
      throw new UnauthorizedException('Sesi verifikasi kedaluwarsa, login ulang');
    }
    if (!payload?.twofa || !payload.sub) {
      throw new UnauthorizedException('Token verifikasi tidak valid');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { member: true },
    });
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new UnauthorizedException('2FA tidak aktif');
    }

    this.assertTotp(code, user.twoFactorSecret);

    return this.buildAuthResponse(user.id, user.email ?? '', user.role, {
      name: user.name,
      memberCode: user.member?.memberCode ?? null,
      pointBalance: user.member?.pointBalance ?? null,
    });
  }

  // ── 2FA (TOTP) management ─────────────────────────────────────────────────

  async getTwoFactorStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    });
    return { enabled: user?.twoFactorEnabled ?? false };
  }

  // Mulai setup: buat secret baru (enabled tetap false) + QR untuk discan.
  async setupTwoFactor(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA sudah aktif');
    }

    const secret = generateSecret();
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    const otpauthUrl = generateURI({
      issuer: 'POLKS',
      label: user.email ?? user.name,
      secret,
    });
    const qrCode = await QRCode.toDataURL(otpauthUrl);
    return { secret, otpauthUrl, qrCode };
  }

  // Konfirmasi setup: verifikasi kode pertama, baru tandai aktif.
  async enableTwoFactor(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('Mulai setup 2FA terlebih dahulu');
    }
    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA sudah aktif');
    }

    this.assertTotp(code, user.twoFactorSecret);
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });
    return { enabled: true };
  }

  // Matikan 2FA: butuh kode TOTP valid, lalu hapus secret.
  async disableTwoFactor(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('2FA belum aktif');
    }

    this.assertTotp(code, user.twoFactorSecret);
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });
    return { enabled: false };
  }

  private assertTotp(code: string, secret: string) {
    const token = (code ?? '').replace(/\s/g, '');
    const result = verifySync({ token, secret, epochTolerance: TOTP_TOLERANCE });
    if (!result.valid) {
      throw new UnauthorizedException('Kode verifikasi salah');
    }
  }

  // Login/registrasi via Google OAuth. Identitas = email. Akun baru → buat
  // User (passwordHash null) + Member. Email yang sudah ada (mis. daftar
  // email+password) → langsung login (ditautkan by email).
  async loginByGoogle(profile: { email: string; name: string }) {
    const email = profile.email.toLowerCase().trim();
    const displayName = profile.name?.trim() || email;

    const existing = await this.prisma.user.findUnique({
      where: { email },
      include: { member: true },
    });
    if (existing) {
      return this.buildAuthResponse(existing.id, existing.email ?? '', existing.role, {
        name: existing.name,
        memberCode: existing.member?.memberCode ?? null,
        pointBalance: existing.member?.pointBalance ?? null,
      });
    }

    try {
      const { user, member } = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: { name: displayName, email, role: Role.CUSTOMER },
        });
        const member = await tx.member.create({
          data: {
            memberCode: generateMemberCode(),
            name: displayName,
            userId: user.id,
          },
        });
        return { user, member };
      });
      return this.buildAuthResponse(user.id, user.email ?? '', user.role, {
        name: user.name,
        memberCode: member.memberCode,
        pointBalance: member.pointBalance,
      });
    } catch (err) {
      // Race: dua login pertama bersamaan untuk email sama → unique conflict.
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        const u = await this.prisma.user.findUnique({
          where: { email },
          include: { member: true },
        });
        if (u) {
          return this.buildAuthResponse(u.id, u.email ?? '', u.role, {
            name: u.name,
            memberCode: u.member?.memberCode ?? null,
            pointBalance: u.member?.pointBalance ?? null,
          });
        }
      }
      throw err;
    }
  }

  async buildAuthResponse(
    userId: string,
    email: string,
    role: Role,
    profile: {
      name: string;
      memberCode: string | null;
      pointBalance: number | null;
    },
  ) {
    const payload: JwtPayload = { sub: userId, email, role };
    const accessToken = await this.jwt.signAsync(payload);
    return {
      access_token: accessToken,
      user: { id: userId, email, role, ...profile },
    };
  }
}
