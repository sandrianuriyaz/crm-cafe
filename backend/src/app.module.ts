import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health/health.controller';
import { WebhooksModule } from './webhooks/webhooks.module';
import { AuthModule } from './auth/auth.module';
import { MemberModule } from './member/member.module';
import { RewardsModule } from './rewards/rewards.module';
import { PromosModule } from './promos/promos.module';
import { AdminModule } from './admin/admin.module';
import { OutletsModule } from './outlets/outlets.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PosModule } from './pos/pos.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,       // bisa dipakai di seluruh modul tanpa import ulang
      validate: validateEnv, // jalankan validasi saat app start
    }),
    PrismaModule,
    WebhooksModule,
    AuthModule,
    MemberModule,
    RewardsModule,
    PromosModule,
    AdminModule,
    OutletsModule,
    NotificationsModule,
    PosModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}