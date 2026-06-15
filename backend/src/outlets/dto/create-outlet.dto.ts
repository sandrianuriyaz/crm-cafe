import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
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

  @ApiPropertyOptional({ example: 'Senin–Minggu, 08.00–22.00' })
  @IsOptional()
  @IsString()
  hours?: string;

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
