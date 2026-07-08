import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { ListQueryDto } from '../../member/dto/list-query.dto';

export class ListAdminTransactionsQueryDto extends ListQueryDto {
  @ApiPropertyOptional({ description: 'Filter transaksi ke satu outlet (id Outlet)' })
  @IsOptional()
  @IsString()
  outletId?: string;
}
