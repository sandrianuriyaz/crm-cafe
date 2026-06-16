import { Body, Controller, Header, Logger, Post, UseGuards } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { WaLoginService } from './wa-login.service';
import { TwilioSignatureGuard } from './guards/twilio-signature.guard';

// Body form-urlencoded dari Twilio (subset field yang dipakai).
interface TwilioInboundBody {
  From?: string; // "whatsapp:+62812..."
  Body?: string; // isi pesan user
}

// Token 24 hex di dalam kurung siku, mis. "[a1b2...]". Fallback: 24 hex polos.
const TOKEN_BRACKET = /\[([a-f0-9]{16,64})\]/i;
const TOKEN_BARE = /\b([a-f0-9]{24})\b/i;

// Webhook pesan WhatsApp masuk dari Twilio. Dikecualikan dari prefix /api/v1
// (lihat main.ts) agar URL yang dikonfigurasi di Twilio stabil.
@Controller('webhooks/whatsapp')
export class WhatsappInboundController {
  private readonly logger = new Logger(WhatsappInboundController.name);

  constructor(private readonly waLogin: WaLoginService) {}

  @Post('inbound')
  @UseGuards(TwilioSignatureGuard) // wajib: cegah pemalsuan `From` (akun takeover)
  @ApiExcludeEndpoint()
  @Header('Content-Type', 'text/xml')
  async inbound(@Body() body: TwilioInboundBody): Promise<string> {
    const text = body.Body ?? '';
    const from = body.From ?? '';
    const token =
      text.match(TOKEN_BRACKET)?.[1] ?? text.match(TOKEN_BARE)?.[1] ?? null;

    if (!token) {
      return this.twiml(
        'Maaf, pesan tidak dikenali. Buka aplikasi POLKS lalu pilih "Continue with WhatsApp".',
      );
    }

    const ok = await this.waLogin.claim(token, from);
    if (!ok) {
      return this.twiml(
        'Link login kedaluwarsa atau tidak valid. Silakan ulangi dari aplikasi POLKS.',
      );
    }

    const link = this.waLogin.buildLoginLink(token);
    this.logger.log(`WA login claimed for ${from}`);
    return this.twiml(
      `Halo! Klik link berikut untuk masuk ke POLKS:\n${link}\n\nBerlaku 15 menit. Jangan bagikan ke siapa pun.`,
    );
  }

  private twiml(message: string): string {
    const escaped = message
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escaped}</Message></Response>`;
  }
}
