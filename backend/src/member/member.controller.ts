import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MemberService } from './member.service';
import { ListQueryDto } from './dto/list-query.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

// Semua route butuh login (Bearer token). Data selalu milik user yang login.
@ApiTags('member')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('member')
export class MemberController {
  constructor(private readonly member: MemberService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Profil member (nama, email, kode, saldo, tier)' })
  profile(@CurrentUser('id') userId: string) {
    return this.member.getProfile(userId);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Edit profil member (nama / nomor HP)' })
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.member.updateProfile(userId, dto);
  }

  @Get('points')
  @ApiOperation({ summary: 'Saldo poin' })
  points(@CurrentUser('id') userId: string) {
    return this.member.getPoints(userId);
  }

  @Get('qr')
  @ApiOperation({ summary: 'QR member (payload + gambar data URL)' })
  qr(@CurrentUser('id') userId: string) {
    return this.member.getQr(userId);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Histori transaksi (paginated)' })
  transactions(@CurrentUser('id') userId: string, @Query() q: ListQueryDto) {
    return this.member.getTransactions(userId, q.skip, q.take);
  }

  @Get('point-histories')
  @ApiOperation({ summary: 'Histori mutasi poin (ledger, paginated)' })
  pointHistories(@CurrentUser('id') userId: string, @Query() q: ListQueryDto) {
    return this.member.getPointHistories(userId, q.skip, q.take);
  }
}
