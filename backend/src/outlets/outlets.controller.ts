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
import { OutletsService } from './outlets.service';
import { CreateOutletDto } from './dto/create-outlet.dto';
import { ListOutletsQueryDto } from './dto/list-outlets-query.dto';
import { UpdateOutletDto } from './dto/update-outlet.dto';

// Tanpa guard kelas: GET /outlets publik. Method admin di-guard sendiri.
@ApiTags('outlets')
@Controller()
export class OutletsController {
  constructor(private readonly outlets: OutletsService) {}

  @Get('outlets')
  @ApiOperation({ summary: 'Daftar outlet aktif (publik)' })
  list() {
    return this.outlets.listPublic();
  }

  @Get('admin/outlets')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Semua outlet (termasuk nonaktif)' })
  listAll(@Query() q: ListOutletsQueryDto) {
    return this.outlets.listAll(q);
  }

  @Post('admin/outlets')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Buat outlet' })
  create(@Body() dto: CreateOutletDto) {
    return this.outlets.create(dto);
  }

  @Patch('admin/outlets/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Ubah outlet' })
  update(@Param('id') id: string, @Body() dto: UpdateOutletDto) {
    return this.outlets.update(id, dto);
  }

  @Delete('admin/outlets/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Hapus outlet' })
  remove(@Param('id') id: string) {
    return this.outlets.remove(id);
  }
}
