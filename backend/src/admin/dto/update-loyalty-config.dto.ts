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

  // ── Tier berbasis belanja bulanan (Rp) ──────────────────────────────────
  @ApiPropertyOptional({ description: 'Ambang belanja/bulan untuk Silver (Rp)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  tierSilverMin?: number;

  @ApiPropertyOptional({ description: 'Ambang belanja/bulan untuk Gold (Rp)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  tierGoldMin?: number;

  @ApiPropertyOptional({ description: 'Ambang belanja/bulan untuk Platinum (Rp)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  tierPlatinumMin?: number;

  @ApiPropertyOptional({ description: 'Rate Bronze: Rp per 1 poin' })
  @IsOptional()
  @IsInt()
  @Min(1)
  rateBronze?: number;

  @ApiPropertyOptional({ description: 'Rate Silver: Rp per 1 poin' })
  @IsOptional()
  @IsInt()
  @Min(1)
  rateSilver?: number;

  @ApiPropertyOptional({ description: 'Rate Gold: Rp per 1 poin' })
  @IsOptional()
  @IsInt()
  @Min(1)
  rateGold?: number;

  @ApiPropertyOptional({ description: 'Rate Platinum: Rp per 1 poin' })
  @IsOptional()
  @IsInt()
  @Min(1)
  ratePlatinum?: number;
}
