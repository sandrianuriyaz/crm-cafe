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
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { EmailChangeRequestDto } from './dto/email-change-request.dto';
import { EmailChangeConfirmDto } from './dto/email-change-confirm.dto';
import {
  TwoFactorCodeDto,
  TwoFactorLoginDto,
  TwoFactorVerifyDto,
} from './dto/two-factor.dto';
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
  @ApiOperation({
    summary: 'Daftar akun customer (klaim member by phone bila ada)',
  })
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
  @ApiOperation({
    summary: 'Callback Google → redirect ke frontend dengan token',
  })
  async googleCallback(
    @Req() req: Request & { user: GoogleProfile },
    @Res() res: Response,
  ) {
    const base = (
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3001'
    ).replace(/\/$/, '');
    try {
      const { access_token } = await this.auth.loginByGoogle(req.user);
      res.redirect(
        `${base}/auth/callback?token=${encodeURIComponent(access_token)}`,
      );
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

  // ── Lupa / reset password ──────────────────────────────────────────────────

  @Post('forgot-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @ApiOperation({ summary: 'Minta tautan reset kata sandi via email' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Set kata sandi baru pakai token dari email' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto.token, dto.password);
  }

  // ── Verifikasi email ────────────────────────────────────────────────────────

  @Post('verify-email/send')
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Kirim ulang tautan verifikasi email ke akun login',
  })
  sendEmailVerification(@CurrentUser() user: AuthUser) {
    return this.auth.sendEmailVerification(user.id);
  }

  @Post('verify-email')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Verifikasi email pakai token dari email' })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.auth.verifyEmail(dto.token);
  }

  // ── Ganti email ──────────────────────────────────────────────────────────

  @Post('email-change/request')
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Minta ganti email — kirim link konfirmasi ke email baru' })
  requestEmailChange(
    @CurrentUser() user: AuthUser,
    @Body() dto: EmailChangeRequestDto,
  ) {
    return this.auth.requestEmailChange(user.id, dto.email);
  }

  @Post('email-change/confirm')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Konfirmasi ganti email pakai token dari email' })
  confirmEmailChange(@Body() dto: EmailChangeConfirmDto) {
    return this.auth.confirmEmailChange(dto.token);
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
  twoFactorEnable(
    @CurrentUser() user: AuthUser,
    @Body() dto: TwoFactorCodeDto,
  ) {
    return this.auth.enableTwoFactor(user.id, dto.code);
  }

  @Post('2fa/disable')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Nonaktifkan 2FA (kode TOTP atau pemulihan)' })
  twoFactorDisable(
    @CurrentUser() user: AuthUser,
    @Body() dto: TwoFactorVerifyDto,
  ) {
    return this.auth.disableTwoFactor(user.id, dto.code);
  }

  @Post('2fa/recovery-codes')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buat ulang kode pemulihan (kode lama hangus)' })
  twoFactorRecoveryCodes(
    @CurrentUser() user: AuthUser,
    @Body() dto: TwoFactorVerifyDto,
  ) {
    return this.auth.regenerateRecoveryCodes(user.id, dto.code);
  }
}
