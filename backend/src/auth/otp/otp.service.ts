import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomInt } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth.service';
import { normalizePhone } from '../../common/phone.util';
import { OTP_SENDER } from './otp-sender';
import type { OtpChannel, OtpSender } from './otp-sender';
import { RequestOtpDto } from '../dto/request-otp.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';

const SALT_ROUNDS = 10;
const OTP_TTL_MS = 5 * 60 * 1000; // kode berlaku 5 menit
const RESEND_COOLDOWN_MS = 30 * 1000; // jeda minimal antar permintaan
const REQUEST_WINDOW_MS = 60 * 60 * 1000; // jendela rate-limit 1 jam
const MAX_REQUESTS_PER_WINDOW = 5;
const MAX_ATTEMPTS = 5; // batas tebakan per kode

const INVALID_OTP_MSG = 'Kode OTP salah atau kedaluwarsa';

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
    @Inject(OTP_SENDER) private readonly sender: OtpSender,
  ) {}

  async request(dto: RequestOtpDto): Promise<{ success: true }> {
    const phone = this.normalize(dto.phone);
    const channel: OtpChannel = dto.channel;
    const now = new Date();

    // Rate limit: maksimal N permintaan per nomor per jam.
    const recentCount = await this.prisma.otpCode.count({
      where: { phone, createdAt: { gt: new Date(now.getTime() - REQUEST_WINDOW_MS) } },
    });
    if (recentCount >= MAX_REQUESTS_PER_WINDOW) {
      throw new HttpException(
        'Terlalu banyak permintaan OTP. Coba lagi nanti.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Cooldown: tolak bila kode aktif terakhir baru saja dibuat.
    const latest = await this.prisma.otpCode.findFirst({
      where: { phone, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (
      latest &&
      now.getTime() - new Date(latest.createdAt).getTime() < RESEND_COOLDOWN_MS
    ) {
      throw new HttpException(
        'Tunggu sebentar sebelum meminta kode lagi.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Invalidasi kode aktif sebelumnya supaya hanya satu kode berlaku.
    await this.prisma.otpCode.updateMany({
      where: { phone, consumedAt: null },
      data: { consumedAt: now },
    });

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const codeHash = await bcrypt.hash(code, SALT_ROUNDS);
    const record = await this.prisma.otpCode.create({
      data: {
        phone,
        codeHash,
        channel,
        expiresAt: new Date(now.getTime() + OTP_TTL_MS),
      },
    });

    try {
      await this.sender.send({ phone, channel, code });
    } catch (err) {
      // Pengiriman gagal → buang kode supaya cooldown tak memblokir percobaan ulang.
      await this.prisma.otpCode.update({
        where: { id: record.id },
        data: { consumedAt: now },
      });
      throw err;
    }

    return { success: true };
  }

  async verify(dto: VerifyOtpDto) {
    const phone = this.normalize(dto.phone);
    const now = new Date();

    const otp = await this.prisma.otpCode.findFirst({
      where: { phone, consumedAt: null, expiresAt: { gt: now } },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp) {
      throw new UnauthorizedException(INVALID_OTP_MSG);
    }

    if (otp.attempts >= MAX_ATTEMPTS) {
      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { consumedAt: now },
      });
      throw new UnauthorizedException(INVALID_OTP_MSG);
    }

    const ok = await bcrypt.compare(dto.code, otp.codeHash);
    if (!ok) {
      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { attempts: otp.attempts + 1 },
      });
      throw new UnauthorizedException(INVALID_OTP_MSG);
    }

    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { consumedAt: now },
    });

    return this.auth.loginByPhone(phone);
  }

  private normalize(phone: string): string {
    try {
      return normalizePhone(phone);
    } catch {
      throw new BadRequestException('Nomor HP tidak valid');
    }
  }
}
