import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Request } from 'express';

// Verifikasi X-Twilio-Signature pada inbound webhook WhatsApp.
// Algoritma Twilio (form-urlencoded): base64(HMAC-SHA1(authToken,
//   fullUrl + concat(sortedKey+value))). Tanpa ini, `From` (nomor pengirim) bisa
// dipalsukan → pengambilalihan akun. Lihat catatan keamanan wa-login.
@Injectable()
export class TwilioSignatureGuard implements CanActivate {
  private readonly logger = new Logger(TwilioSignatureGuard.name);

  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    // Opt-out eksplisit HANYA untuk dev/local (mis. tanpa tunnel publik).
    if (this.config.get<string>('WHATSAPP_VERIFY_SIGNATURE') === 'false') {
      this.logger.warn(
        'Verifikasi X-Twilio-Signature DINONAKTIFKAN (WHATSAPP_VERIFY_SIGNATURE=false). Hanya untuk dev.',
      );
      return true;
    }

    const authToken = this.config.get<string>('TWILIO_AUTH_TOKEN');
    if (!authToken) {
      // Aman secara default: tanpa token, tak bisa verifikasi → tolak.
      throw new UnauthorizedException(
        'Webhook tidak dapat diverifikasi (TWILIO_AUTH_TOKEN belum diset)',
      );
    }

    const signature = req.header('x-twilio-signature');
    if (!signature) {
      throw new UnauthorizedException('Missing X-Twilio-Signature');
    }

    const url = this.buildUrl(req);
    const params = (req.body ?? {}) as Record<string, string>;
    const data = Object.keys(params)
      .sort()
      .reduce((acc, key) => acc + key + String(params[key]), url);
    const expected = createHmac('sha1', authToken)
      .update(Buffer.from(data, 'utf-8'))
      .digest('base64');

    if (!this.safeEqual(signature, expected)) {
      throw new UnauthorizedException('Invalid Twilio signature');
    }
    return true;
  }

  // URL persis yang dipakai Twilio. Di belakang proxy (Railway/Render), pakai
  // header X-Forwarded-*. PUBLIC_WEBHOOK_BASE_URL bisa override bila perlu.
  private buildUrl(req: Request): string {
    const override = this.config.get<string>('PUBLIC_WEBHOOK_BASE_URL');
    if (override) return `${override.replace(/\/$/, '')}${req.originalUrl}`;
    const proto = (req.header('x-forwarded-proto') ?? req.protocol)
      .split(',')[0]
      .trim();
    const host = req.header('x-forwarded-host') ?? req.header('host');
    return `${proto}://${host}${req.originalUrl}`;
  }

  private safeEqual(a: string, b: string): boolean {
    const ab = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ab.length !== bb.length) return false;
    return timingSafeEqual(ab, bb);
  }
}
