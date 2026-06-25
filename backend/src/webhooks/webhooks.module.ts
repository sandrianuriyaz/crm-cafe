import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { TierModule } from '../tier/tier.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [TierModule, RealtimeModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule {}
