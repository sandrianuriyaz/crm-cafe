import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { LoyaltyConfigService } from './loyalty-config.service';
import { RealtimeModule } from '../realtime/realtime.module';
import { BirthdayModule } from '../birthday/birthday.module';

@Module({
  imports: [RealtimeModule, BirthdayModule],
  controllers: [AdminController],
  providers: [AdminService, LoyaltyConfigService],
})
export class AdminModule {}
