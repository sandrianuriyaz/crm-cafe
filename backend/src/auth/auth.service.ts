import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { generateMemberCode } from '../common/member-code.util';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';

const SALT_ROUNDS = 10;

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

    return this.buildAuthResponse(user.id, user.email ?? '', user.role, {
      name: user.name,
      memberCode: user.member?.memberCode ?? null,
      pointBalance: user.member?.pointBalance ?? null,
    });
  }

  // Login/registrasi via nomor HP (dipakai alur OTP setelah kode terverifikasi).
  // Cari user dengan phone ini; kalau belum ada, buat User+Member otomatis
  // (klaim member POS yang belum punya akun bila nomornya cocok).
  async loginByPhone(phone: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { phone },
      include: { member: true },
    });
    if (existingUser) {
      return this.buildAuthResponse(
        existingUser.id,
        existingUser.email ?? '',
        existingUser.role,
        {
          name: existingUser.name,
          memberCode: existingUser.member?.memberCode ?? null,
          pointBalance: existingUser.member?.pointBalance ?? null,
        },
      );
    }

    const { user, member } = await this.prisma.$transaction(async (tx) => {
      const existingMember = await tx.member.findUnique({ where: { phone } });
      const name = existingMember?.name ?? phone;

      const user = await tx.user.create({
        data: { name, phone, role: Role.CUSTOMER },
      });

      let member;
      if (existingMember && !existingMember.userId) {
        // Klaim member POS yang belum punya akun → poin lama kebawa.
        member = await tx.member.update({
          where: { id: existingMember.id },
          data: { userId: user.id, name: existingMember.name ?? name },
        });
      } else if (!existingMember) {
        member = await tx.member.create({
          data: {
            memberCode: generateMemberCode(),
            name,
            phone,
            userId: user.id,
          },
        });
      } else {
        // phone sudah dipakai member milik user lain → buat member tanpa phone.
        member = await tx.member.create({
          data: { memberCode: generateMemberCode(), name, userId: user.id },
        });
      }

      return { user, member };
    });

    return this.buildAuthResponse(user.id, user.email ?? '', user.role, {
      name: user.name,
      memberCode: member.memberCode,
      pointBalance: member.pointBalance,
    });
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
