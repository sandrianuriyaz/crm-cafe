import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional, IsString } from 'class-validator';
import { ListQueryDto } from '../../member/dto/list-query.dto';

export class ListWebhooksQueryDto extends ListQueryDto {
  @ApiPropertyOptional({
    description: 'Filter status log',
    example: 'duplicate',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Dari tanggal (ISO-8601)' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'Sampai tanggal (ISO-8601)' })
  @IsOptional()
  @IsISO8601()
  to?: string;
}

export class ListVouchersQueryDto extends ListQueryDto {
  @ApiPropertyOptional({
    description: 'Filter status voucher',
    enum: ['ACTIVE', 'USED', 'EXPIRED'],
  })
  @IsOptional()
  @IsString()
  status?: string;
}
