import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Lindungi route — wajib Bearer token valid. Pakai @UseGuards(JwtAuthGuard).
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
