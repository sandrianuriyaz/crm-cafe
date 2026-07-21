import { Module } from '@nestjs/common';
import { RewardsController } from './rewards.controller';
import { RewardsService } from './rewards.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { BirthdayModule } from '../birthday/birthday.module';

@Module({
  imports: [NotificationsModule, BirthdayModule],
  controllers: [RewardsController],
  providers: [RewardsService],
})
export class RewardsModule {}
