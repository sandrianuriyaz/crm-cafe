import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class ExchangeWaLinkDto {
  @ApiProperty({ description: 'Token dari /auth/wa-link/request' })
  @IsString()
  @Length(8, 64)
  token!: string;
}
