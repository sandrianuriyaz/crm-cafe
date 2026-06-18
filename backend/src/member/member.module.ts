import { Module } from '@nestjs/common';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';
import { TierModule } from '../tier/tier.module';

@Module({
  imports: [TierModule],
  controllers: [MemberController],
  providers: [MemberService],
})
export class MemberModule {}
