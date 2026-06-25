import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

// Hanya kode TOTP 6 digit (dipakai saat aktivasi 2FA).
export class TwoFactorCodeDto {
  @ApiProperty({ example: '123456', description: 'Kode 6 digit dari authenticator' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Kode 2FA harus 6 digit angka' })
  code!: string;
}

// Kode TOTP ATAU kode pemulihan (login, nonaktifkan, buat ulang kode).
export class TwoFactorVerifyDto {
  @ApiProperty({ example: '123456', description: 'Kode TOTP 6 digit atau kode pemulihan' })
  @IsString()
  @Length(6, 40)
  code!: string;
}

export class TwoFactorLoginDto {
  @ApiProperty({ description: 'Tiket dari respons /auth/login (twoFactorToken)' })
  @IsString()
  twoFactorToken!: string;

  @ApiProperty({ example: '123456', description: 'Kode TOTP 6 digit atau kode pemulihan' })
  @IsString()
  @Length(6, 40)
  code!: string;
}
