import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { OutletStatus } from '@prisma/client';

export class CreateOutletDto {
  @ApiProperty({ example: 'POLKS Braga' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional({ example: 'Bandung' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Jl. Braga No. 12, Bandung 40111' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '09:00', description: 'Jam buka HH:MM' })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'openTime harus format HH:MM' })
  openTime?: string;

  @ApiPropertyOptional({ example: '21:00', description: 'Jam tutup HH:MM' })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'closeTime harus format HH:MM' })
  closeTime?: string;

  @ApiPropertyOptional({
    example: [0],
    description: 'Hari libur, 0=Minggu s/d 6=Sabtu',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  closedDays?: number[];

  @ApiPropertyOptional({ example: 'https://maps.app.goo.gl/xxxx' })
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  mapsUrl?: string;

  @ApiPropertyOptional({ example: '+62 22 1234 5678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ enum: OutletStatus, default: OutletStatus.ACTIVE })
  @IsOptional()
  @IsEnum(OutletStatus)
  status?: OutletStatus;

  @ApiPropertyOptional({ description: 'POS store_id untuk pemetaan outlet' })
  @IsOptional()
  @IsString()
  storeId?: string;
}
