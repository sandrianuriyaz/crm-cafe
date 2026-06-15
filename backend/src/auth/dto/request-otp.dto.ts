import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';
import type { OtpChannel } from '../otp/otp-sender';

export class RequestOtpDto {
  @ApiProperty({ example: '081234567890' })
  @IsString()
  phone!: string;

  @ApiProperty({ enum: ['whatsapp', 'sms'], example: 'whatsapp' })
  @IsIn(['whatsapp', 'sms'])
  channel!: OtpChannel;
}
