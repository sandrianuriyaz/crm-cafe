import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Length, MinLength } from 'class-validator';

export const BROADCAST_TARGETS = [
  'all',
  'silver',
  'gold',
  'platinum',
  'inactive',
] as const;
export type BroadcastTarget = (typeof BROADCAST_TARGETS)[number];

export class CreateBroadcastDto {
  @ApiProperty({ example: 'Promo Akhir Pekan' })
  @IsString()
  @MinLength(2)
  title!: string;

  @ApiProperty({ example: 'Nikmati diskon 20% akhir pekan ini!' })
  @IsString()
  @Length(1, 500)
  message!: string;

  @ApiProperty({ enum: BROADCAST_TARGETS, example: 'all' })
  @IsIn(BROADCAST_TARGETS as unknown as string[])
  target!: BroadcastTarget;

  @ApiPropertyOptional({ description: 'URL gambar (opsional), diupload lewat POST /admin/uploads' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
