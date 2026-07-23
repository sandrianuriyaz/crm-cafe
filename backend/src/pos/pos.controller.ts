import {
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { PosApiKeyGuard } from './guards/pos-api-key.guard';
import { PosService } from './pos.service';

// Subtotal datang sebagai query string. Nilai yang tidak masuk akal (bukan
// angka, negatif) diperlakukan sebagai "tidak dikirim" — lebih baik CRM diam
// tidak menilai daripada menolak transaksi sah karena salah ketik parameter.
function parseSubtotal(raw?: string): number | undefined {
  if (raw === undefined || raw.trim() === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

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
  @ApiQuery({
    name: 'subtotal',
    required: false,
    description:
      'Total belanja sebelum diskon & pajak. Bila dikirim, respons ikut menilai syarat minimum belanja (`eligible`).',
  })
  async validate(
    @Param('code') code: string,
    @Res({ passthrough: true }) res: Response,
    @Query('subtotal') subtotal?: string,
  ) {
    const result = await this.pos.validateVoucher(code, parseSubtotal(subtotal));
    if (!result) {
      res.status(HttpStatus.NOT_FOUND);
      return { message: 'Voucher tidak ditemukan' };
    }
    res.status(HttpStatus.OK);
    return result;
  }

  @Post(':code/redeem')
  @ApiOperation({ summary: '[POS] Tandai voucher USED (atomic, sekali pakai)' })
  @ApiQuery({
    name: 'subtotal',
    required: false,
    description:
      'Total belanja sebelum diskon & pajak. Bila dikirim, syarat minimum belanja ditegakkan (422 bila kurang).',
  })
  async redeem(
    @Param('code') code: string,
    @Res({ passthrough: true }) res: Response,
    @Query('subtotal') subtotal?: string,
  ) {
    const result = await this.pos.redeemVoucher(code, parseSubtotal(subtotal));
    if (result.kind === 'not_found') {
      res.status(HttpStatus.NOT_FOUND);
      return { message: 'Voucher tidak ditemukan' };
    }
    if (result.kind === 'conflict') {
      res.status(HttpStatus.CONFLICT);
      return { ok: false, message: 'Voucher sudah dipakai atau tidak aktif' };
    }
    // 422, bukan 409: vouchernya sah dan masih aktif — yang kurang belanjanya.
    // Kasir perlu pesan yang benar, bukan "voucher sudah dipakai".
    if (result.kind === 'below_minimum') {
      res.status(HttpStatus.UNPROCESSABLE_ENTITY);
      return {
        ok: false,
        message: `Minimum belanja Rp${result.minPurchase.toLocaleString('id-ID')} belum terpenuhi`,
        min_purchase: result.minPurchase,
        subtotal: result.subtotal,
      };
    }
    res.status(HttpStatus.OK);
    return result.body;
  }
}
