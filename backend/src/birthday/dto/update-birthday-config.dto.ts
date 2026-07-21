import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { RewardType } from '@prisma/client';

// Hadiahnya didefinisikan di sini — tidak menunjuk reward katalog.
export class UpdateBirthdayConfigDto {
  @ApiPropertyOptional({ description: 'Aktifkan pemberian otomatis' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ example: 'Kopi Gratis Ulang Tahun' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  imageUrl?: string | null;

  @ApiPropertyOptional({ enum: RewardType })
  @IsOptional()
  @IsEnum(RewardType)
  type?: RewardType;

  // Rupiah utk DISCOUNT_AMOUNT, 1-100 utk DISCOUNT_PERCENT (dicek di service
  // karena batasnya bergantung pada type yang bisa saja tidak ikut dikirim).
  @ApiPropertyOptional({ nullable: true, example: 10 })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsInt()
  @Min(0)
  value?: number | null;

  @ApiPropertyOptional({ nullable: true, example: 50000 })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsInt()
  @Min(0)
  minPurchase?: number | null;

  @ApiPropertyOptional({ nullable: true, example: 'Americano' })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  freeItemName?: string | null;

  @ApiPropertyOptional({ example: 7, description: 'Masa berlaku voucher (hari)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  voucherValidDays?: number;
}
