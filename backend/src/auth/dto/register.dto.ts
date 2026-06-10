import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Budi Santoso' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 'budi@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'rahasia123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;

  // Kalau diisi & cocok dengan Member dari POS yang belum punya akun,
  // member itu diklaim (poin lama kebawa). Lihat AuthService.register.
  @ApiPropertyOptional({ example: '+6281234567890' })
  @IsOptional()
  @IsString()
  phone?: string;
}
