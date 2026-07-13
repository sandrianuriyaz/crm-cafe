import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class EmailChangeRequestDto {
  @ApiProperty({ example: 'baru@example.com' })
  @IsEmail()
  email!: string;
}
