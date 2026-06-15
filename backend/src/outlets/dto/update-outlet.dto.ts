import { PartialType } from '@nestjs/swagger';
import { CreateOutletDto } from './create-outlet.dto';

// Semua field opsional saat update.
export class UpdateOutletDto extends PartialType(CreateOutletDto) {}
