import { PartialType } from '@nestjs/swagger';
import { CreateRewardDto } from './create-reward.dto';

// Semua field opsional saat update.
export class UpdateRewardDto extends PartialType(CreateRewardDto) {}
