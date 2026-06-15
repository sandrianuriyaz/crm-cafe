import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { LoyaltyConfigService } from './loyalty-config.service';
import { AdjustPointsDto } from './dto/adjust-points.dto';
import { ListMembersQueryDto } from './dto/list-members-query.dto';
import { ListQueryDto } from '../member/dto/list-query.dto';
import {
  ListVouchersQueryDto,
  ListWebhooksQueryDto,
} from './dto/list-webhooks-query.dto';
import { UpdateLoyaltyConfigDto } from './dto/update-loyalty-config.dto';

// Semua route admin. Wajib login + role ADMIN.
@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly loyaltyConfig: LoyaltyConfigService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: '[Admin] Statistik dashboard' })
  stats() {
    return this.admin.stats();
  }

  @Get('loyalty-config')
  @ApiOperation({ summary: '[Admin] Ambil konfigurasi loyalty' })
  getLoyaltyConfig() {
    return this.loyaltyConfig.get();
  }

  @Patch('loyalty-config')
  @ApiOperation({ summary: '[Admin] Ubah konfigurasi loyalty' })
  updateLoyaltyConfig(@Body() dto: UpdateLoyaltyConfigDto) {
    return this.loyaltyConfig.update(dto);
  }

  @Get('members')
  @ApiOperation({ summary: '[Admin] Daftar member (cari + paginated)' })
  members(@Query() q: ListMembersQueryDto) {
    return this.admin.listMembers(q);
  }

  @Get('members/:id')
  @ApiOperation({ summary: '[Admin] Detail member + transaksi & poin terakhir' })
  member(@Param('id') id: string) {
    return this.admin.getMember(id);
  }

  @Post('members/:id/adjust-points')
  @ApiOperation({ summary: '[Admin] Sesuaikan poin manual (audit di ledger)' })
  adjust(@Param('id') id: string, @Body() dto: AdjustPointsDto) {
    return this.admin.adjustPoints(id, dto);
  }

  @Get('transactions')
  @ApiOperation({ summary: '[Admin] Semua transaksi POS (audit)' })
  transactions(@Query() q: ListQueryDto) {
    return this.admin.listTransactions(q.skip, q.take);
  }

  @Get('vouchers')
  @ApiOperation({ summary: '[Admin] Semua voucher lintas member' })
  vouchers(@Query() q: ListVouchersQueryDto) {
    return this.admin.listVouchers(q);
  }

  @Patch('vouchers/:id')
  @ApiOperation({ summary: '[Admin] Tandai voucher USED' })
  markVoucherUsed(@Param('id') id: string) {
    return this.admin.markVoucherUsed(id);
  }

  @Get('redeems')
  @ApiOperation({ summary: '[Admin] Riwayat penukaran semua member' })
  redeems(@Query() q: ListQueryDto) {
    return this.admin.listRedeems(q.skip, q.take);
  }

  @Get('webhooks')
  @ApiOperation({ summary: '[Admin] Log event POS masuk (filter status/tanggal)' })
  webhooks(@Query() q: ListWebhooksQueryDto) {
    return this.admin.listWebhooks(q);
  }

  @Get('idempotency-keys')
  @ApiOperation({ summary: '[Admin] Audit idempotency key (anti-duplikat)' })
  idempotencyKeys(@Query() q: ListQueryDto) {
    return this.admin.listIdempotencyKeys(q.skip, q.take);
  }

  @Get('pos-sync')
  @ApiOperation({ summary: '[Admin] Ringkasan sinkronisasi POS per store' })
  posSync() {
    return this.admin.posSyncSummary();
  }
}
