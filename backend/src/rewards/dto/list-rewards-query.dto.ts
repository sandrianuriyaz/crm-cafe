import { ApiPropertyOptional } from '@nestjs/swagger';
import { RewardStatus, RewardType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListRewardsQueryDto {
  @ApiPropertyOptional({ description: 'Cari di nama / deskripsi' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: RewardStatus })
  @IsOptional()
  @IsEnum(RewardStatus)
  status?: RewardStatus;

  @ApiPropertyOptional({ enum: RewardType })
  @IsOptional()
  @IsEnum(RewardType)
  type?: RewardType;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number = 0;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number = 20;
}
