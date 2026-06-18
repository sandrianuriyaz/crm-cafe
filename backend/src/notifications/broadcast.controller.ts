import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ListQueryDto } from '../member/dto/list-query.dto';
import { NotificationsService } from './notifications.service';
import { CreateBroadcastDto } from './dto/create-broadcast.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class BroadcastController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post('broadcast')
  @ApiOperation({ summary: '[Admin] Kirim broadcast in-app ke member target' })
  send(@Body() dto: CreateBroadcastDto) {
    return this.notifications.broadcast(dto);
  }

  @Get('broadcasts')
  @ApiOperation({ summary: '[Admin] Riwayat broadcast' })
  history(@Query() q: ListQueryDto) {
    return this.notifications.listBroadcasts(q.skip, q.take);
  }
}
