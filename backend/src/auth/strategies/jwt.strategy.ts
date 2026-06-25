import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Role } from '@prisma/client';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: Role;
  // Tiket sementara antara login & verifikasi 2FA — BUKAN access_token penuh.
  twofa?: boolean;
}

// Isi req.user setelah token diverifikasi.
export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET')!,
    });
  }

  validate(payload: JwtPayload): AuthUser {
    // Tiket 2FA hanya boleh dipakai di /auth/2fa/login, bukan sebagai Bearer.
    if (payload.twofa) {
      throw new UnauthorizedException('Token belum lolos verifikasi 2FA');
    }
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
