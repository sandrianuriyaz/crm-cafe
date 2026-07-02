import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

// Semua field opsional (partial update). Hanya field yang dikirim yang diubah.
export class UpdateNotificationSettingsDto {
  @ApiPropertyOptional({ description: 'Terima notifikasi via email' })
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Terima push/realtime in-app' })
  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Notifikasi promo' })
  @IsOptional()
  @IsBoolean()
  promoNotifications?: boolean;

  @ApiPropertyOptional({ description: 'Notifikasi poin' })
  @IsOptional()
  @IsBoolean()
  pointNotifications?: boolean;

  @ApiPropertyOptional({ description: 'Notifikasi reward' })
  @IsOptional()
  @IsBoolean()
  rewardNotifications?: boolean;
}
