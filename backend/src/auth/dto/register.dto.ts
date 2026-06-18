import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

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

  // Wajib. Kalau cocok dengan Member dari POS yang belum punya akun, member itu
  // diklaim (poin lama kebawa). Lihat AuthService.register.
  @ApiProperty({ example: '081234567890' })
  @IsString()
  @MinLength(8)
  phone!: string;
}
