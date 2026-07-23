import {
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { PosApiKeyGuard } from './guards/pos-api-key.guard';
import { PosService } from './pos.service';

// Endpoint POS-facing untuk redeem voucher reward di kasir. Dipanggil
// server-to-server dari edge function POS (auth x-api-key), bukan dari app.
// Body error sengaja dikirim apa adanya (tidak lewat AllExceptionsFilter)
// agar persis sesuai kontrak POS.
@ApiTags('pos')
@ApiHeader({
  name: 'x-api-key',
  required: true,
  description: 'CRM_WEBHOOK_SECRET',
})
@UseGuards(PosApiKeyGuard)
@Controller('pos/vouchers')
export class PosController {
  constructor(private readonly pos: PosService) {}

  @Get(':code')
  @ApiOperation({ summary: '[POS] Validasi voucher reward by code' })
  async validate(
    @Param('code') code: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.pos.validateVoucher(code);
    if (!result) {
      res.status(HttpStatus.NOT_FOUND);
      return { message: 'Voucher tidak ditemukan' };
    }
    res.status(HttpStatus.OK);
    return result;
  }

  @Post(':code/redeem')
  @ApiOperation({ summary: '[POS] Tandai voucher USED (atomic, sekali pakai)' })
  async redeem(
    @Param('code') code: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.pos.redeemVoucher(code);
    if (result.kind === 'not_found') {
      res.status(HttpStatus.NOT_FOUND);
      return { message: 'Voucher tidak ditemukan' };
    }
    if (result.kind === 'conflict') {
      res.status(HttpStatus.CONFLICT);
      return { ok: false, message: 'Voucher sudah dipakai atau tidak aktif' };
    }
    res.status(HttpStatus.OK);
    return result.body;
  }
}
