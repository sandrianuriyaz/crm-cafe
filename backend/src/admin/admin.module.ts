import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { LoyaltyConfigService } from './loyalty-config.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, LoyaltyConfigService],
})
export class AdminModule {}
