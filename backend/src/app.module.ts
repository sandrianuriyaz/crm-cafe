import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health/health.controller';
import { WebhooksModule } from './webhooks/webhooks.module';
import { AuthModule } from './auth/auth.module';
import { MemberModule } from './member/member.module';

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
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}