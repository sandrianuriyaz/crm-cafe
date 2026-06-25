import { Module } from '@nestjs/common';
import { RealtimeModule } from '../realtime/realtime.module';
import { PosController } from './pos.controller';
import { PosService } from './pos.service';

@Module({
  imports: [RealtimeModule],
  controllers: [PosController],
  providers: [PosService],
})
export class PosModule {}
