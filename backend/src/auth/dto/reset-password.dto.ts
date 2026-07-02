import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'a1b2c3...', description: 'Token dari tautan email' })
  @IsString()
  token!: string;

  @ApiProperty({ example: 'rahasiaBaru123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;
}
