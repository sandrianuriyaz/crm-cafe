import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthTokenType, Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { generateSecret, generateURI, verifySync } from 'otplib';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { generateMemberCode } from '../common/member-code.util';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';

const SALT_ROUNDS = 10;
// Masa berlaku token reset password & verifikasi email (ms).
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 jam
const EMAIL_VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24 jam
const EMAIL_CHANGE_TTL_MS = 24 * 60 * 60 * 1000; // 24 jam
// Toleransi waktu verifikasi TOTP (detik) — menutup jeda ketik & selisih jam.
const TOTP_TOLERANCE = 30;
// Umur "tiket" antara login (password benar) dan input kode 2FA.
const TWO_FA_TICKET_TTL = '5m';
// Jumlah kode pemulihan yang dibuat saat aktivasi 2FA.
const RECOVERY_CODE_COUNT = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const phone = dto.phone?.trim() || null;
    const birthDate = dto.birthDate ? new Date(dto.birthDate) : null;

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
              birthDate: existingMember.birthDate ?? birthDate,
            },
          });
        } else if (!existingMember) {
          member = await tx.member.create({
            data: {
              memberCode: generateMemberCode(),
              name: dto.name.trim(),
              phone,
              birthDate,
              userId: user.id,
            },
          });
        } else {
          // phone sudah dipakai member milik user lain → buat member tanpa phone
          member = await tx.member.create({
            data: {
              memberCode: generateMemberCode(),
              name: dto.name.trim(),
              birthDate,
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
      throw new UnauthorizedException(
        'Sesi verifikasi kedaluwarsa, login ulang',
      );
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

    // Terima kode TOTP ATAU salah satu kode pemulihan (sekali pakai).
    const result = await this.verifyTwoFactorCode(
      user.twoFactorSecret,
      user.twoFactorRecoveryCodes,
      code,
    );
    if (result.consumedRecovery) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { twoFactorRecoveryCodes: result.remainingRecovery },
      });
    }

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

  // Konfirmasi setup: verifikasi kode pertama (TOTP), tandai aktif, lalu buat
  // kode pemulihan yang ditampilkan SEKALI ke user.
  async enableTwoFactor(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('Mulai setup 2FA terlebih dahulu');
    }
    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA sudah aktif');
    }

    this.assertTotp(code, user.twoFactorSecret);
    const { plain, hashes } = await this.makeRecoveryCodes();
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true, twoFactorRecoveryCodes: hashes },
    });
    return { enabled: true, recoveryCodes: plain };
  }

  // Matikan 2FA: butuh kode TOTP/pemulihan valid, lalu hapus secret & kode.
  async disableTwoFactor(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('2FA belum aktif');
    }

    await this.verifyTwoFactorCode(
      user.twoFactorSecret,
      user.twoFactorRecoveryCodes,
      code,
    );
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorRecoveryCodes: [],
      },
    });
    return { enabled: false };
  }

  // Buat ulang kode pemulihan (kode lama hangus). Butuh kode TOTP/pemulihan valid.
  async regenerateRecoveryCodes(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('2FA belum aktif');
    }

    await this.verifyTwoFactorCode(
      user.twoFactorSecret,
      user.twoFactorRecoveryCodes,
      code,
    );
    const { plain, hashes } = await this.makeRecoveryCodes();
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorRecoveryCodes: hashes },
    });
    return { recoveryCodes: plain };
  }

  private assertTotp(code: string, secret: string) {
    const token = (code ?? '').replace(/\s/g, '');
    const result = verifySync({
      token,
      secret,
      epochTolerance: TOTP_TOLERANCE,
    });
    if (!result.valid) {
      throw new UnauthorizedException('Kode verifikasi salah');
    }
  }

  // Verifikasi kode 2FA: coba TOTP dulu, lalu fallback ke kode pemulihan
  // (sekali pakai). Throw bila tak ada yang cocok. Pemanggil yang menyimpan
  // konsumsi recovery (remainingRecovery) bila consumedRecovery true.
  private async verifyTwoFactorCode(
    secret: string,
    recoveryHashes: string[],
    code: string,
  ): Promise<{ consumedRecovery: boolean; remainingRecovery: string[] }> {
    const totp = (code ?? '').replace(/\s/g, '');
    if (
      /^\d{6}$/.test(totp) &&
      verifySync({ token: totp, secret, epochTolerance: TOTP_TOLERANCE }).valid
    ) {
      return { consumedRecovery: false, remainingRecovery: recoveryHashes };
    }

    const normalized = this.normalizeRecovery(code);
    if (normalized.length >= 8) {
      for (const hash of recoveryHashes) {
        if (await bcrypt.compare(normalized, hash)) {
          return {
            consumedRecovery: true,
            remainingRecovery: recoveryHashes.filter((h) => h !== hash),
          };
        }
      }
    }
    throw new UnauthorizedException('Kode verifikasi salah');
  }

  private normalizeRecovery(code: string): string {
    return (code ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  // Buat sekumpulan kode pemulihan: kembalikan plaintext (untuk ditampilkan
  // sekali) + hash bcrypt (untuk disimpan). Format tampil: "xxxxx-xxxxx".
  private async makeRecoveryCodes() {
    const plain: string[] = [];
    for (let i = 0; i < RECOVERY_CODE_COUNT; i++) {
      const raw = randomBytes(5).toString('hex'); // 10 hex char
      plain.push(`${raw.slice(0, 5)}-${raw.slice(5)}`);
    }
    const hashes = await Promise.all(
      plain.map((c) => bcrypt.hash(this.normalizeRecovery(c), SALT_ROUNDS)),
    );
    return { plain, hashes };
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
      return this.buildAuthResponse(
        existing.id,
        existing.email ?? '',
        existing.role,
        {
          name: existing.name,
          memberCode: existing.member?.memberCode ?? null,
          pointBalance: existing.member?.pointBalance ?? null,
        },
      );
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

  // ── Lupa / reset password ─────────────────────────────────────────────────

  // Selalu balas sukses tanpa membocorkan apakah email terdaftar (anti user
  // enumeration). Token asli hanya dikirim via email; DB menyimpan hash-nya.
  async forgotPassword(rawEmail: string) {
    const email = rawEmail.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Hanya kirim bila user ada DAN punya password (akun OTP/Google tanpa
    // password tidak bisa direset — mereka login lewat jalur lain).
    if (user && user.passwordHash) {
      const { token, tokenHash } = this.makeToken();
      await this.prisma.$transaction([
        // Batalkan token reset lama yang belum dipakai.
        this.prisma.authToken.updateMany({
          where: {
            userId: user.id,
            type: AuthTokenType.PASSWORD_RESET,
            usedAt: null,
          },
          data: { usedAt: new Date() },
        }),
        this.prisma.authToken.create({
          data: {
            userId: user.id,
            type: AuthTokenType.PASSWORD_RESET,
            tokenHash,
            expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
          },
        }),
      ]);

      const url = `${this.frontendBase()}/auth/reset-password?token=${token}`;
      await this.mail.sendPasswordReset(email, user.name, url);
    }

    return {
      message:
        'Jika email terdaftar, tautan reset kata sandi telah dikirim ke email tersebut.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const record = await this.consumeToken(token, AuthTokenType.PASSWORD_RESET);
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      this.prisma.authToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      // Batalkan token reset lain yang masih menganggur untuk user ini.
      this.prisma.authToken.updateMany({
        where: {
          userId: record.userId,
          type: AuthTokenType.PASSWORD_RESET,
          usedAt: null,
        },
        data: { usedAt: new Date() },
      }),
    ]);

    return {
      message: 'Kata sandi berhasil diperbarui. Silakan login kembali.',
    };
  }

  // ── Verifikasi email ────────────────────────────────────────────────────────

  async sendEmailVerification(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.email) {
      throw new BadRequestException('Akun tidak punya alamat email');
    }
    if (user.emailVerified) {
      throw new BadRequestException('Email sudah terverifikasi');
    }

    const { token, tokenHash } = this.makeToken();
    await this.prisma.$transaction([
      this.prisma.authToken.updateMany({
        where: {
          userId: user.id,
          type: AuthTokenType.EMAIL_VERIFY,
          usedAt: null,
        },
        data: { usedAt: new Date() },
      }),
      this.prisma.authToken.create({
        data: {
          userId: user.id,
          type: AuthTokenType.EMAIL_VERIFY,
          tokenHash,
          expiresAt: new Date(Date.now() + EMAIL_VERIFY_TTL_MS),
        },
      }),
    ]);

    const url = `${this.frontendBase()}/auth/verify-email?token=${token}`;
    await this.mail.sendEmailVerification(user.email, user.name, url);
    return { message: 'Tautan verifikasi telah dikirim ke email kamu.' };
  }

  async verifyEmail(token: string) {
    const record = await this.consumeToken(token, AuthTokenType.EMAIL_VERIFY);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { emailVerified: true, emailVerifiedAt: new Date() },
      }),
      this.prisma.authToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);
    return { message: 'Email berhasil diverifikasi.', emailVerified: true };
  }

  // ── Ganti email (identitas login) ───────────────────────────────────────────

  async requestEmailChange(userId: string, rawEmail: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    // Akun Google-only tidak punya password — Google login dicocokkan murni
    // via email (tidak ada googleId terpisah), jadi email di sini tak boleh diubah.
    if (!user.passwordHash) {
      throw new BadRequestException(
        'Akun ini masuk lewat Google, email tidak bisa diubah di sini',
      );
    }

    const email = rawEmail.toLowerCase().trim();
    if (email === user.email) {
      throw new BadRequestException('Email baru sama dengan email saat ini');
    }

    const conflict = await this.prisma.user.findUnique({ where: { email } });
    if (conflict) {
      throw new ConflictException('Email sudah dipakai akun lain');
    }

    const { token, tokenHash } = this.makeToken();
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { pendingEmail: email },
      }),
      this.prisma.authToken.updateMany({
        where: { userId, type: AuthTokenType.EMAIL_CHANGE, usedAt: null },
        data: { usedAt: new Date() },
      }),
      this.prisma.authToken.create({
        data: {
          userId,
          type: AuthTokenType.EMAIL_CHANGE,
          tokenHash,
          expiresAt: new Date(Date.now() + EMAIL_CHANGE_TTL_MS),
        },
      }),
    ]);

    const url = `${this.frontendBase()}/auth/confirm-email-change?token=${token}`;
    await this.mail.sendEmailChangeConfirmation(email, user.name, url);
    return { message: 'Tautan konfirmasi telah dikirim ke email baru.' };
  }

  // ── Helper token sekali-pakai ───────────────────────────────────────────────

  // Buat token acak: `token` dikirim ke user, `tokenHash` (sha256) disimpan.
  private makeToken(): { token: string; tokenHash: string } {
    const token = randomBytes(32).toString('hex');
    return { token, tokenHash: this.hashToken(token) };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  // Cari token berdasar hash, pastikan sesuai tipe, belum dipakai & belum
  // kedaluwarsa. Tidak menandai used (pemanggil yang menandai dalam transaksi).
  private async consumeToken(token: string, type: AuthTokenType) {
    const tokenHash = this.hashToken((token ?? '').trim());
    const record = await this.prisma.authToken.findUnique({
      where: { tokenHash },
    });
    if (!record || record.type !== type || record.usedAt) {
      throw new BadRequestException('Token tidak valid atau sudah dipakai');
    }
    if (record.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Token sudah kedaluwarsa');
    }
    return record;
  }

  private frontendBase(): string {
    return (
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3001'
    ).replace(/\/$/, '');
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
