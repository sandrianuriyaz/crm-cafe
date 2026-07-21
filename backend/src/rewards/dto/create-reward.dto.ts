import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { RewardStatus, RewardType } from '@prisma/client';

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

  // Efek reward saat di-redeem (dibaca POS). Default MANUAL.
  @ApiPropertyOptional({ enum: RewardType, default: RewardType.MANUAL })
  @IsOptional()
  @IsEnum(RewardType)
  type?: RewardType;

  // Rupiah utk DISCOUNT_AMOUNT, 0-100 utk DISCOUNT_PERCENT, null utk lainnya.
  @ApiPropertyOptional({ example: 10000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  value?: number;

  // Minimal total belanja (Rp) agar diskon berlaku — informasi saja untuk
  // kasir/POS baca manual, tidak divalidasi otomatis oleh server.
  @ApiPropertyOptional({ example: 50000, description: 'Minimal belanja (Rp) — informasi saja' })
  @IsOptional()
  @IsInt()
  @Min(0)
  minPurchase?: number;

  // Hanya untuk FREE_ITEM.
  @ApiPropertyOptional({ example: 'Americano' })
  @IsOptional()
  @IsString()
  freeItemName?: string;

  // Periode tayang di katalog customer. Kosong = tak dibatasi di sisi itu.
  @ApiPropertyOptional({ example: '2026-08-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  startAt?: string;

  @ApiPropertyOptional({ example: '2026-08-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  endAt?: string;

  // Outlet mana reward ini relevan — kosong/tidak dikirim = semua outlet.
  @ApiPropertyOptional({ type: [String], description: 'Id Outlet yang relevan (kosong = semua outlet)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  outletIds?: string[];

  // Kirim notifikasi inbox + realtime ke semua member saat reward ini dirilis.
  // Default true; hanya berpengaruh bila reward berstatus ACTIVE. Bukan kolom
  // DB — dibuang sebelum menulis ke Prisma.
  @ApiPropertyOptional({
    default: true,
    description: 'Beri tahu member saat reward dirilis (hanya bila ACTIVE)',
  })
  @IsOptional()
  @IsBoolean()
  notify?: boolean;
}
