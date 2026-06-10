import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Kontrak event transaction.completed — lihat docs/integrasi-crm.md §4–§5.
// Field tambahan dari POS dibuang otomatis oleh ValidationPipe (whitelist).

export class CustomerDto {
  @ApiPropertyOptional({ description: 'serverId pelanggan POS; null untuk walk-in' })
  @IsOptional()
  @IsString()
  id?: string | null;

  @ApiPropertyOptional({ description: 'Bisa "Pelanggan Umum"' })
  @IsOptional()
  @IsString()
  name?: string | null;

  @ApiPropertyOptional({ description: 'Fallback match kalau id null' })
  @IsOptional()
  @IsString()
  phone?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_member?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  consent_saved?: boolean;
}

export class TransactionItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  product_id?: string | null;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsInt()
  qty!: number;

  @ApiProperty()
  @IsInt()
  unit_price!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  variant?: string | null;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  addons?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_reward?: boolean;

  @ApiProperty()
  @IsInt()
  line_total!: number;
}

export class TransactionDto {
  @ApiProperty({ description: 'ID order di server (= idempotency_key)' })
  @IsString()
  order_id!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  order_number?: string;

  @ApiPropertyOptional({ description: 'dine_in | take_away' })
  @IsOptional()
  @IsString()
  order_type?: string;

  @ApiPropertyOptional({ description: 'selesai' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cashier_id?: string;

  @ApiPropertyOptional({ default: 'IDR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  subtotal?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  discount_total?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  tax_total?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  tax_inclusive?: boolean;

  @ApiProperty({ description: 'Total akhir yang dibayar; baseline earning poin' })
  @IsInt()
  grand_total!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  payment_method?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  points_used?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  points_discount_rupiah?: number;

  @ApiProperty({ type: [TransactionItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionItemDto)
  items!: TransactionItemDto[];
}

export class PosTransactionEventDto {
  @ApiProperty({ description: 'Selalu "transaction.completed" di Fase 1' })
  @IsString()
  event!: string;

  @ApiPropertyOptional({ description: 'Unik per pengiriman (beda tiap retry)' })
  @IsOptional()
  @IsString()
  event_id?: string;

  @ApiPropertyOptional({ description: 'ISO-8601 UTC' })
  @IsOptional()
  @IsString()
  occurred_at?: string;

  @ApiProperty({ description: 'Stabil per-order. Kunci dedup.' })
  @IsString()
  idempotency_key!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  store_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branch_id?: string;

  @ApiProperty({ type: CustomerDto })
  @IsObject()
  @ValidateNested()
  @Type(() => CustomerDto)
  customer!: CustomerDto;

  @ApiProperty({ type: TransactionDto })
  @IsObject()
  @ValidateNested()
  @Type(() => TransactionDto)
  transaction!: TransactionDto;
}
