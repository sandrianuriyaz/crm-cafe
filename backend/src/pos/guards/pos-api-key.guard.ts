import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import { Request } from 'express';

// Auth server-to-server untuk endpoint POS-facing. Dipanggil dari edge function
// POS (bukan dari app), jadi secret aman dipegang. Membandingkan header
// x-api-key dengan CRM_WEBHOOK_SECRET (secret yang sama dengan webhook POS).
@Injectable()
export class PosApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    const header = req.header('x-api-key');
    if (!header) {
      throw new UnauthorizedException('Missing x-api-key header');
    }

    const secret = this.config.get<string>('CRM_WEBHOOK_SECRET')!;
    if (!this.safeEqual(header, secret)) {
      throw new UnauthorizedException('Invalid API key');
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
