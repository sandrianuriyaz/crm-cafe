import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

// Batas ukuran payload yang ikut disimpan saat request ditolak, supaya body
// besar/sampah tidak membengkakkan tabel audit.
const MAX_RAW_LOG_CHARS = 10_000;

// Verifikasi X-Signature: sha256=<hmac>, hmac = HMAC_SHA256(secret, raw body).
// Lihat docs/integrasi-crm.md §6. Tolak 401 kalau tidak cocok.
//
// WAJIB pakai raw body (bukan JSON yang sudah di-parse/re-serialize), karena
// HMAC dihitung POS dari byte mentah. main.ts mengaktifkan { rawBody: true }
// sehingga req.rawBody tersedia sebagai Buffer.
//
// Setiap penolakan dicatat ke PosSyncLog dengan status `invalid_signature`
// supaya terlihat di Webhook Inbox — tanpa ini, secret yang salah/kadaluarsa
// di sisi POS tampak seperti "POS tidak mengirim apa-apa".
@Injectable()
export class HmacGuard implements CanActivate {
  private readonly logger = new Logger(HmacGuard.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<Request & { rawBody?: Buffer }>();

    const header = req.header('x-signature');
    if (!header) {
      await this.reject(req, 'Missing X-Signature header');
    }

    const rawBody = req.rawBody;
    if (!rawBody || rawBody.length === 0) {
      await this.reject(req, 'Missing request body for signature check');
    }

    const secret = this.config.get<string>('CRM_WEBHOOK_SECRET')!;
    const expected =
      'sha256=' + createHmac('sha256', secret).update(rawBody!).digest('hex');

    if (!this.safeEqual(header!, expected)) {
      await this.reject(req, 'Invalid signature');
    }
    return true;
  }

  // Perbandingan constant-time untuk hindari timing attack.
  private safeEqual(a: string, b: string): boolean {
    const ab = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ab.length !== bb.length) return false;
    return timingSafeEqual(ab, bb);
  }

  // Catat penolakan lalu lempar 401. Return type `never` supaya pemanggil
  // tidak perlu `return`/`throw` sendiri.
  private async reject(
    req: Request & { rawBody?: Buffer },
    reason: string,
  ): Promise<never> {
    await this.logRejected(req, reason);
    throw new UnauthorizedException(reason);
  }

  private async logRejected(
    req: Request & { rawBody?: Buffer },
    reason: string,
  ): Promise<void> {
    try {
      const text = req.rawBody?.toString('utf8') ?? '';
      const parsed = this.tryParse(text);

      await this.prisma.posSyncLog.create({
        data: {
          eventId: this.asString(parsed?.event_id),
          idempotencyKey:
            req.header('x-idempotency-key') ??
            this.asString(parsed?.idempotency_key) ??
            this.asString(
              (parsed?.transaction as Record<string, unknown> | undefined)
                ?.order_id,
            ) ??
            '',
          status: 'invalid_signature',
          errorMessage: reason,
          rawPayload: (parsed ??
            // Body tak bisa di-parse → simpan apa adanya (dipotong).
            { raw: text.slice(0, MAX_RAW_LOG_CHARS) }) as Prisma.InputJsonValue,
        },
      });
    } catch (e) {
      // Audit log tidak boleh mengubah hasil guard — request tetap ditolak 401.
      this.logger.error(`Failed to write PosSyncLog: ${(e as Error).message}`);
    }
  }

  private tryParse(text: string): Record<string, unknown> | null {
    if (!text || text.length > MAX_RAW_LOG_CHARS) return null;
    try {
      const v: unknown = JSON.parse(text);
      return v && typeof v === 'object' && !Array.isArray(v)
        ? (v as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }

  private asString(v: unknown): string | null {
    return typeof v === 'string' && v.length > 0 ? v : null;
  }
}
