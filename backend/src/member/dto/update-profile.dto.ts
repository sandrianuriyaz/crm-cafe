import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Budi Santoso' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: '081234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  // Buat birthday reward nanti — belum ada trigger otomatis.
  @ApiPropertyOptional({ example: '2000-05-17' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;
}
