import {
  Body,
  Controller,
  Get,
  Param,
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
import { AdjustPointsDto } from './dto/adjust-points.dto';
import { ListMembersQueryDto } from './dto/list-members-query.dto';
import { ListQueryDto } from '../member/dto/list-query.dto';

// Semua route admin. Wajib login + role ADMIN.
@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

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
}
