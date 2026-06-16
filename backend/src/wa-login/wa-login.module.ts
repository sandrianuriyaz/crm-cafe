import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WaLoginService } from './wa-login.service';
import { WaLoginController } from './wa-login.controller';
import { WhatsappInboundController } from './whatsapp-inbound.controller';

@Module({
  imports: [AuthModule], // butuh AuthService.loginByPhone
  controllers: [WaLoginController, WhatsappInboundController],
  providers: [WaLoginService],
})
export class WaLoginModule {}
