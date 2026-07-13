import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class EmailChangeConfirmDto {
  @ApiProperty({ example: 'a1b2c3...', description: 'Token dari tautan email' })
  @IsString()
  token!: string;
}
