import { Module } from '@nestjs/common';
import { RealtimeModule } from '../realtime/realtime.module';
import { PosController } from './pos.controller';
import { PosMembersController } from './pos-members.controller';
import { PosService } from './pos.service';

@Module({
  imports: [RealtimeModule],
  controllers: [PosController, PosMembersController],
  providers: [PosService],
})
export class PosModule {}
