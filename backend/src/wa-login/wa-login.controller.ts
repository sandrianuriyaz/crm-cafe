import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { WaLoginService } from './wa-login.service';
import { ExchangeWaLinkDto } from './dto/exchange-wa-link.dto';

@ApiTags('auth')
@Controller('auth/wa-link')
export class WaLoginController {
  constructor(private readonly waLogin: WaLoginService) {}

  @Post('request')
  @HttpCode(200)
  @ApiOperation({ summary: 'Mulai login WhatsApp: balas token + link wa.me' })
  request() {
    return this.waLogin.request();
  }

  @Post('exchange')
  @HttpCode(200)
  @ApiOperation({ summary: 'Tukar token jadi sesi (dipakai polling & klik link)' })
  exchange(@Body() dto: ExchangeWaLinkDto) {
    return this.waLogin.exchange(dto.token);
  }
}
