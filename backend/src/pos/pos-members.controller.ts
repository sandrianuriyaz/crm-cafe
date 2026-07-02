import {
  Controller,
  Get,
  HttpStatus,
  Param,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { PosApiKeyGuard } from './guards/pos-api-key.guard';
import { PosService } from './pos.service';

// Endpoint POS-facing untuk menarik saldo poin member kapan saja (jaring
// pengaman sync, mis. setelah order Rp0 yang lunas via poin dan tidak dikirim
// sebagai transaksi). Auth x-api-key sama dengan endpoint voucher.
@ApiTags('pos')
@ApiHeader({
  name: 'x-api-key',
  required: true,
  description: 'CRM_WEBHOOK_SECRET',
})
@UseGuards(PosApiKeyGuard)
@Controller('pos/members')
export class PosMembersController {
  constructor(private readonly pos: PosService) {}

  @Get(':externalCustomerId')
  @ApiOperation({ summary: '[POS] Ambil saldo poin member by externalCustomerId' })
  async getMember(
    @Param('externalCustomerId') externalCustomerId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const member = await this.pos.getMember(externalCustomerId);
    if (!member) {
      res.status(HttpStatus.NOT_FOUND);
      return { message: 'Member tidak ditemukan' };
    }
    res.status(HttpStatus.OK);
    return member;
  }
}
