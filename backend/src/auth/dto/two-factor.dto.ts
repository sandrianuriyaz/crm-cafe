import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class TwoFactorCodeDto {
  @ApiProperty({ example: '123456', description: 'Kode 6 digit dari authenticator' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Kode 2FA harus 6 digit angka' })
  code!: string;
}

export class TwoFactorLoginDto {
  @ApiProperty({ description: 'Tiket dari respons /auth/login (twoFactorToken)' })
  @IsString()
  twoFactorToken!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Kode 2FA harus 6 digit angka' })
  code!: string;
}
