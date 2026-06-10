import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,       // bisa dipakai di seluruh modul tanpa import ulang
      validate: validateEnv, // jalankan validasi saat app start
    }),
    PrismaModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}