import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { HmacGuard } from './guards/hmac.guard';
import { PosTransactionEventDto } from './dto/pos-transaction.dto';
import { WebhooksService } from './webhooks.service';

// Checklist 1 & 2: endpoint penerima event POS + verifikasi HMAC.
// Path sengaja TIDAK memakai prefix /api/v1 agar persis sesuai kontrak §4
// (lihat exclude di main.ts).
@ApiTags('webhooks')
@Controller('webhooks/pos')
export class WebhooksController {
  constructor(private readonly webhooks: WebhooksService) {}

  @Post('transactions')
  @UseGuards(HmacGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'Terima event transaction.completed dari POS' })
  @ApiHeader({ name: 'X-Event', required: false })
  @ApiHeader({ name: 'X-Idempotency-Key', required: false })
  @ApiHeader({ name: 'X-Signature', required: true, description: 'sha256=<hmac>' })
  async transactions(
    @Body() dto: PosTransactionEventDto,
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('x-idempotency-key') headerKey?: string,
  ) {
    // Header X-Idempotency-Key dipakai sebagai fallback kalau body tidak punya.
    if (!dto.idempotency_key && headerKey) {
      dto.idempotency_key = headerKey;
    }

    // Checklist 7: pemrosesan ringan (beberapa insert dalam 1 DB transaction),
    // selesai jauh di bawah target timeout ~10 dtk POS, lalu balas 2xx.
    const result = await this.webhooks.handleTransactionCompleted(
      dto,
      req.rawBody ? JSON.parse(req.rawBody.toString('utf8')) : dto,
    );

    // Respons kontrak §7. Field poin opsional (diabaikan POS di Fase 1).
    return {
      ok: true,
      duplicate: result.duplicate,
      customer_crm_id: result.customer_crm_id,
      points_awarded: result.points_awarded,
      points_balance: result.points_balance,
    };
  }
}
