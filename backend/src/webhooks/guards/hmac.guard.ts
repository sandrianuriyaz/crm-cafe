import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Request } from 'express';

// Verifikasi X-Signature: sha256=<hmac>, hmac = HMAC_SHA256(secret, raw body).
// Lihat docs/integrasi-crm.md §6. Tolak 401 kalau tidak cocok.
//
// WAJIB pakai raw body (bukan JSON yang sudah di-parse/re-serialize), karena
// HMAC dihitung POS dari byte mentah. main.ts mengaktifkan { rawBody: true }
// sehingga req.rawBody tersedia sebagai Buffer.
@Injectable()
export class HmacGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request & { rawBody?: Buffer }>();

    const header = req.header('x-signature');
    if (!header) {
      throw new UnauthorizedException('Missing X-Signature header');
    }

    const rawBody = req.rawBody;
    if (!rawBody || rawBody.length === 0) {
      throw new UnauthorizedException('Missing request body for signature check');
    }

    const secret = this.config.get<string>('CRM_WEBHOOK_SECRET')!;
    const expected =
      'sha256=' + createHmac('sha256', secret).update(rawBody).digest('hex');

    if (!this.safeEqual(header, expected)) {
      throw new UnauthorizedException('Invalid signature');
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
}
