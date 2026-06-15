import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateLoyaltyConfigDto {
  @ApiPropertyOptional({ description: 'Rupiah per 1 poin (earning)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  rupiahPerPoint?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  pointsPerUnit?: number;

  @ApiPropertyOptional({ description: 'Poin kedaluwarsa setelah N bulan (null = tak ada)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  pointExpiryMonths?: number;

  @ApiPropertyOptional({
    description: 'Ambang tier [{ name, minPoints }]',
    type: 'array',
  })
  @IsOptional()
  @IsArray()
  tierThresholds?: unknown[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requireIdempotencyKeys?: boolean;
}
