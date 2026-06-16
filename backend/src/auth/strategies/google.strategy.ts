import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type Profile, type VerifyCallback } from 'passport-google-oauth20';

export interface GoogleProfile {
  email: string;
  name: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    // Fallback placeholder agar app tetap boot saat Google belum dikonfigurasi
    // (OAuth baru benar-benar jalan ketika env asli diisi).
    super({
      clientID: config.get<string>('GOOGLE_CLIENT_ID') ?? 'not-configured',
      clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET') ?? 'not-configured',
      callbackURL:
        config.get<string>('GOOGLE_CALLBACK_URL') ??
        'http://localhost:3000/api/v1/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new Error('Email Google tidak tersedia'));
      return;
    }
    // Tolak email yang belum diverifikasi Google — kalau tidak, identitas bisa
    // diklaim tanpa benar-benar memiliki email itu (potensi account takeover).
    const json = profile._json as { email_verified?: boolean } | undefined;
    if (json?.email_verified !== true) {
      done(new Error('Email Google belum terverifikasi'));
      return;
    }
    const user: GoogleProfile = { email, name: profile.displayName || email };
    done(null, user);
  }
}
