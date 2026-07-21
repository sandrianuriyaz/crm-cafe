import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
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

  // ── Hadiah ulang tahun ────────────────────────────────────────────────────
  @ApiPropertyOptional({ description: 'Aktifkan hadiah ulang tahun otomatis' })
  @IsOptional()
  @IsBoolean()
  birthdayEnabled?: boolean;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Id Reward yang dihadiahkan; null untuk mengosongkan',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  birthdayRewardId?: string | null;

  @ApiPropertyOptional({ description: 'Masa berlaku voucher ulang tahun (hari)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  birthdayVoucherDays?: number;
}
