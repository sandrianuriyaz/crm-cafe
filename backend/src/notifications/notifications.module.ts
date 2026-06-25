import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { BroadcastController } from './broadcast.controller';
import { NotificationsController } from './notifications.controller';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [RealtimeModule],
  controllers: [BroadcastController, NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
