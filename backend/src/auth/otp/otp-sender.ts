import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { toE164 } from '../../common/phone.util';

export type OtpChannel = 'whatsapp' | 'sms';

export interface OtpSendParams {
  phone: string; // kanonik 08xxx
  channel: OtpChannel;
  code: string;
}

export interface OtpSender {
  send(params: OtpSendParams): Promise<void>;
}

// Token DI untuk OtpSender (interface tak bisa jadi token di Nest).
export const OTP_SENDER = 'OTP_SENDER';

// Pengirim OTP via Twilio Messages API. Memanggil REST API langsung dengan
// fetch bawaan Node (tanpa SDK tambahan). Kredensial dari .env; kalau hilang,
// error baru muncul saat benar-benar mengirim (boot app tetap jalan).
@Injectable()
export class TwilioOtpSender implements OtpSender {
  constructor(private readonly config: ConfigService) {}

  async send({ phone, channel, code }: OtpSendParams): Promise<void> {
    const sid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const token = this.config.get<string>('TWILIO_AUTH_TOKEN');
    if (!sid || !token) {
      throw new InternalServerErrorException(
        'Konfigurasi Twilio belum lengkap (TWILIO_ACCOUNT_SID/AUTH_TOKEN).',
      );
    }

    const fromRaw =
      channel === 'whatsapp'
        ? this.config.get<string>('TWILIO_WHATSAPP_FROM')
        : this.config.get<string>('TWILIO_SMS_FROM');
    if (!fromRaw) {
      throw new InternalServerErrorException(
        `Nomor pengirim Twilio untuk channel ${channel} belum dikonfigurasi.`,
      );
    }

    const to = toE164(phone);
    const prefix = channel === 'whatsapp' ? 'whatsapp:' : '';
    const body = new URLSearchParams({
      To: `${prefix}${to}`,
      From: `${prefix}${fromRaw}`,
      Body: `Kode OTP POLKS Anda: ${code}. Berlaku 5 menit. Jangan bagikan ke siapa pun.`,
    });

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization:
            'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      },
    );

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new InternalServerErrorException(
        `Gagal mengirim OTP via Twilio (${res.status}). ${detail}`.trim(),
      );
    }
  }
}
