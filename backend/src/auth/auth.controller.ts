import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TwoFactorCodeDto, TwoFactorLoginDto } from './dto/two-factor.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthUser } from './strategies/jwt.strategy';
import type { GoogleProfile } from './strategies/google.strategy';

@ApiTags('auth')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Daftar akun customer (klaim member by phone bila ada)' })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Login, balas access_token (JWT)' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Mulai OAuth Google (redirect ke Google)' })
  googleAuth() {
    // Redirect ke Google ditangani guard. Body tak terpakai.
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Callback Google → redirect ke frontend dengan token' })
  async googleCallback(
    @Req() req: Request & { user: GoogleProfile },
    @Res() res: Response,
  ) {
    const base = (
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3001'
    ).replace(/\/$/, '');
    try {
      const { access_token } = await this.auth.loginByGoogle(req.user);
      res.redirect(`${base}/auth/callback?token=${encodeURIComponent(access_token)}`);
    } catch {
      res.redirect(`${base}/auth/callback?error=google_login_failed`);
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Info user dari token (cek token valid)' })
  me(@CurrentUser() user: AuthUser) {
    return user;
  }

  // ── 2FA (TOTP) ──────────────────────────────────────────────────────────

  @Post('2fa/login')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Tukar tiket 2FA + kode TOTP jadi access_token' })
  loginTwoFactor(@Body() dto: TwoFactorLoginDto) {
    return this.auth.loginTwoFactor(dto.twoFactorToken, dto.code);
  }

  @Get('2fa/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Status 2FA akun (aktif/tidak)' })
  twoFactorStatus(@CurrentUser() user: AuthUser) {
    return this.auth.getTwoFactorStatus(user.id);
  }

  @Post('2fa/setup')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mulai setup 2FA → balas secret + QR' })
  twoFactorSetup(@CurrentUser() user: AuthUser) {
    return this.auth.setupTwoFactor(user.id);
  }

  @Post('2fa/enable')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aktifkan 2FA (verifikasi kode pertama)' })
  twoFactorEnable(@CurrentUser() user: AuthUser, @Body() dto: TwoFactorCodeDto) {
    return this.auth.enableTwoFactor(user.id, dto.code);
  }

  @Post('2fa/disable')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Nonaktifkan 2FA (verifikasi kode)' })
  twoFactorDisable(@CurrentUser() user: AuthUser, @Body() dto: TwoFactorCodeDto) {
    return this.auth.disableTwoFactor(user.id, dto.code);
  }
}
