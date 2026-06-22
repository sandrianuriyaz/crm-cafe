import {
  Body,
  Controller,
  Delete,
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
import { PromosService } from './promos.service';
import { CreatePromoDto } from './dto/create-promo.dto';
import { ListPromosQueryDto } from './dto/list-promos-query.dto';
import { UpdatePromoDto } from './dto/update-promo.dto';

// GET /promos & /promos/:id PUBLIK (tanpa login) supaya banner home guest bisa
// menampilkan promo asli. Route admin di-guard sendiri.
@ApiTags('promos')
@Controller()
export class PromosController {
  constructor(private readonly promos: PromosService) {}

  // ── Customer (publik) ──────────────────────────────────────────────────────
  @Get('promos')
  @ApiOperation({ summary: 'Promo yang sedang aktif (publik)' })
  list() {
    return this.promos.listActive();
  }

  @Get('promos/:id')
  @ApiOperation({ summary: 'Detail promo (publik)' })
  detail(@Param('id') id: string) {
    return this.promos.getOne(id);
  }

  // ── Admin ───────────────────────────────────────────────────────────────
  @Post('admin/promos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Buat promo' })
  create(@Body() dto: CreatePromoDto) {
    return this.promos.create(dto);
  }

  @Get('admin/promos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Semua promo (termasuk nonaktif/kedaluwarsa)' })
  listAll(@Query() q: ListPromosQueryDto) {
    return this.promos.listAll(q);
  }

  @Patch('admin/promos/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Ubah promo' })
  update(@Param('id') id: string, @Body() dto: UpdatePromoDto) {
    return this.promos.update(id, dto);
  }

  @Delete('admin/promos/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Nonaktifkan promo (soft-delete)' })
  remove(@Param('id') id: string) {
    return this.promos.remove(id);
  }
}
