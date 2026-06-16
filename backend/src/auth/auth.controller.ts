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
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { OtpService } from './otp/otp.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthUser } from './strategies/jwt.strategy';
import type { GoogleProfile } from './strategies/google.strategy';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly otp: OtpService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Daftar akun customer (klaim member by phone bila ada)' })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login, balas access_token (JWT)' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('otp/request')
  @HttpCode(200)
  @ApiOperation({ summary: 'Kirim kode OTP 6 digit via WhatsApp/SMS' })
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.otp.request(dto);
  }

  @Post('otp/verify')
  @HttpCode(200)
  @ApiOperation({ summary: 'Verifikasi OTP, balas access_token (buat akun bila baru)' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.otp.verify(dto);
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
}
