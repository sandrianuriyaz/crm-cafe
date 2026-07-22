import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsUrl, ValidateNested } from 'class-validator';

// Bentuknya mengikuti PushSubscription.toJSON() milik browser — frontend cukup
// mengirim hasil serialisasi itu apa adanya.
class PushKeysDto {
  @ApiProperty({ description: 'Kunci publik P-256 milik browser' })
  @IsString()
  @IsNotEmpty()
  p256dh!: string;

  @ApiProperty({ description: 'Rahasia autentikasi milik browser' })
  @IsString()
  @IsNotEmpty()
  auth!: string;
}

export class CreatePushSubscriptionDto {
  @ApiProperty({ description: 'URL push service (FCM/Mozilla/Apple)' })
  @IsUrl({ protocols: ['https'], require_protocol: true })
  endpoint!: string;

  @ApiProperty({ type: PushKeysDto })
  @ValidateNested()
  @Type(() => PushKeysDto)
  keys!: PushKeysDto;
}

export class DeletePushSubscriptionDto {
  @ApiProperty({ description: 'Endpoint langganan yang dicabut' })
  @IsUrl({ protocols: ['https'], require_protocol: true })
  endpoint!: string;
}
