import { Module } from '@nestjs/common';
import { BirthdayController } from './birthday.controller';
import { BirthdayService } from './birthday.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [BirthdayController],
  providers: [BirthdayService],
  exports: [BirthdayService],
})
export class BirthdayModule {}
