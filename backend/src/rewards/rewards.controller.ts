import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
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
import { UpdateRewardDto } from './dto/update-reward.dto';

@ApiTags('rewards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class RewardsController {
  constructor(private readonly rewards: RewardsService) {}

  // ── Customer ──────────────────────────────────────────────────────────────
  @Get('rewards')
  @ApiOperation({ summary: 'Katalog reward aktif' })
  list() {
    return this.rewards.listActive();
  }

  @Get('rewards/:id')
  @ApiOperation({ summary: 'Detail reward' })
  detail(@Param('id') id: string) {
    return this.rewards.getOne(id);
  }

  @Post('rewards/:id/redeem')
  @HttpCode(200)
  @ApiOperation({ summary: 'Tukar poin dengan reward → voucher' })
  redeem(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.rewards.redeem(userId, id);
  }

  @Get('vouchers')
  @ApiOperation({ summary: 'Voucher milik saya' })
  vouchers(@CurrentUser('id') userId: string) {
    return this.rewards.listVouchers(userId);
  }

  @Get('redeems')
  @ApiOperation({ summary: 'Histori redeem saya' })
  redeems(@CurrentUser('id') userId: string) {
    return this.rewards.listRedeems(userId);
  }

  // ── Admin ───────────────────────────────────────────────────────────────
  @Post('admin/rewards')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Buat reward' })
  create(@Body() dto: CreateRewardDto) {
    return this.rewards.create(dto);
  }

  @Get('admin/rewards')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Semua reward (termasuk nonaktif)' })
  listAll() {
    return this.rewards.listAll();
  }

  @Patch('admin/rewards/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Ubah reward' })
  update(@Param('id') id: string, @Body() dto: UpdateRewardDto) {
    return this.rewards.update(id, dto);
  }

  @Delete('admin/rewards/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Nonaktifkan reward (soft-delete)' })
  remove(@Param('id') id: string) {
    return this.rewards.remove(id);
  }
}
