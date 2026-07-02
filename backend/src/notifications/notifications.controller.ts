import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ListQueryDto } from '../member/dto/list-query.dto';
import { NotificationsService } from './notifications.service';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';

@ApiTags('member')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('member/notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Inbox notifikasi member (paginated)' })
  list(@CurrentUser('id') userId: string, @Query() q: ListQueryDto) {
    return this.notifications.listForMember(userId, q.skip, q.take);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Jumlah notifikasi belum dibaca' })
  unread(@CurrentUser('id') userId: string) {
    return this.notifications.unreadCount(userId);
  }

  @Get('settings')
  @ApiOperation({ summary: 'Preferensi notifikasi member' })
  getSettings(@CurrentUser('id') userId: string) {
    return this.notifications.getSettings(userId);
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Ubah preferensi notifikasi member (partial)' })
  updateSettings(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateNotificationSettingsDto,
  ) {
    return this.notifications.updateSettings(userId, dto);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Tandai satu notifikasi dibaca' })
  read(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.notifications.markRead(userId, id);
  }

  @Post('read-all')
  @HttpCode(200)
  @ApiOperation({ summary: 'Tandai semua notifikasi dibaca' })
  readAll(@CurrentUser('id') userId: string) {
    return this.notifications.markAllRead(userId);
  }
}
