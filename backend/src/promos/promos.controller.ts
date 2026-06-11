import {
  Body,
  Controller,
  Delete,
  Get,
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
import { PromosService } from './promos.service';
import { CreatePromoDto } from './dto/create-promo.dto';
import { UpdatePromoDto } from './dto/update-promo.dto';

@ApiTags('promos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class PromosController {
  constructor(private readonly promos: PromosService) {}

  // ── Customer ──────────────────────────────────────────────────────────────
  @Get('promos')
  @ApiOperation({ summary: 'Promo yang sedang aktif' })
  list() {
    return this.promos.listActive();
  }

  @Get('promos/:id')
  @ApiOperation({ summary: 'Detail promo' })
  detail(@Param('id') id: string) {
    return this.promos.getOne(id);
  }

  // ── Admin ───────────────────────────────────────────────────────────────
  @Post('admin/promos')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Buat promo' })
  create(@Body() dto: CreatePromoDto) {
    return this.promos.create(dto);
  }

  @Get('admin/promos')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Semua promo (termasuk nonaktif/kedaluwarsa)' })
  listAll() {
    return this.promos.listAll();
  }

  @Patch('admin/promos/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Ubah promo' })
  update(@Param('id') id: string, @Body() dto: UpdatePromoDto) {
    return this.promos.update(id, dto);
  }

  @Delete('admin/promos/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Nonaktifkan promo (soft-delete)' })
  remove(@Param('id') id: string) {
    return this.promos.remove(id);
  }
}
