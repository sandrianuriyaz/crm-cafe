import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { RewardStatus } from '@prisma/client';

export class CreateRewardDto {
  @ApiProperty({ example: 'Free Americano' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ example: 500, description: 'Poin yang dibutuhkan' })
  @IsInt()
  @Min(1)
  pointCost!: number;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(0)
  stock!: number;

  @ApiPropertyOptional({ enum: RewardStatus, default: RewardStatus.ACTIVE })
  @IsOptional()
  @IsEnum(RewardStatus)
  status?: RewardStatus;
}
