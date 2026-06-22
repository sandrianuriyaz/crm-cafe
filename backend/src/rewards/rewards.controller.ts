import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RewardsService } from './rewards.service';
import { CreateRewardDto } from './dto/create-reward.dto';
import { ListRewardsQueryDto } from './dto/list-rewards-query.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';

// GET /rewards & /rewards/:id PUBLIK (katalog bisa dilihat guest sebelum login).
// Aksi member (redeem/vouchers/redeems) & admin di-guard sendiri.
@ApiTags('rewards')
@Controller()
export class RewardsController {
  constructor(private readonly rewards: RewardsService) {}

  // ── Customer (publik) ──────────────────────────────────────────────────────
  @Get('rewards')
  @ApiOperation({ summary: 'Katalog reward aktif (publik)' })
  list() {
    return this.rewards.listActive();
  }

  @Get('rewards/:id')
  @ApiOperation({ summary: 'Detail reward (publik)' })
  detail(@Param('id') id: string) {
    return this.rewards.getOne(id);
  }

  // ── Member (perlu login) ────────────────────────────────────────────────
  @Post('rewards/:id/redeem')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Tukar poin dengan reward → voucher' })
  redeem(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.rewards.redeem(userId, id);
  }

  @Get('vouchers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Voucher milik saya' })
  vouchers(@CurrentUser('id') userId: string) {
    return this.rewards.listVouchers(userId);
  }

  @Get('redeems')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Histori redeem saya' })
  redeems(@CurrentUser('id') userId: string) {
    return this.rewards.listRedeems(userId);
  }

  // ── Admin ───────────────────────────────────────────────────────────────
  @Post('admin/rewards')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Buat reward' })
  create(@Body() dto: CreateRewardDto) {
    return this.rewards.create(dto);
  }

  @Get('admin/rewards')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Semua reward (termasuk nonaktif)' })
  listAll(@Query() q: ListRewardsQueryDto) {
    return this.rewards.listAll(q);
  }

  @Patch('admin/rewards/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Ubah reward' })
  update(@Param('id') id: string, @Body() dto: UpdateRewardDto) {
    return this.rewards.update(id, dto);
  }

  @Delete('admin/rewards/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Nonaktifkan reward (soft-delete)' })
  remove(@Param('id') id: string) {
    return this.rewards.remove(id);
  }
}
