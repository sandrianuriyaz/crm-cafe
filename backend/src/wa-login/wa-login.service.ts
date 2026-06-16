import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { normalizePhone } from '../common/phone.util';

const TTL_MS = 15 * 60 * 1000; // link berlaku 15 menit
const TOKEN_BYTES = 12; // → 24 karakter hex

export type ExchangeResult =
  | { status: 'pending' | 'expired' | 'consumed' | 'invalid' }
  | { status: 'ok'; access_token: string; user: unknown };

@Injectable()
export class WaLoginService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  // Buat permintaan login + link wa.me berisi token (teks WhatsApp terisi otomatis).
  async request(): Promise<{ token: string; waUrl: string }> {
    const token = randomBytes(TOKEN_BYTES).toString('hex');
    await this.prisma.waLoginRequest.create({
      data: { token, expiresAt: new Date(Date.now() + TTL_MS) },
    });
    return { token, waUrl: this.buildWaUrl(token) };
  }

  // Dipanggil inbound webhook saat user mengirim pesan WA berisi token.
  // Menandai request sebagai claimed + menyimpan nomor pengirim.
  async claim(token: string, rawPhone: string): Promise<boolean> {
    const req = await this.prisma.waLoginRequest.findUnique({ where: { token } });
    if (!req || req.consumedAt || req.expiresAt < new Date()) return false;

    let phone: string;
    try {
      // From Twilio berbentuk "whatsapp:+62...". Buang prefix sebelum normalisasi.
      phone = normalizePhone(rawPhone.replace(/^whatsapp:/i, '').trim());
    } catch {
      return false;
    }

    await this.prisma.waLoginRequest.update({
      where: { token },
      data: { phone, claimedAt: req.claimedAt ?? new Date() },
    });
    return true;
  }

  // Tukar token jadi sesi. Single-use: yang menukar duluan menang.
  async exchange(token: string): Promise<ExchangeResult> {
    const now = new Date();
    const req = await this.prisma.waLoginRequest.findUnique({ where: { token } });
    if (!req) return { status: 'invalid' };
    if (req.consumedAt) return { status: 'consumed' };
    if (req.expiresAt < now) return { status: 'expired' };
    if (!req.claimedAt || !req.phone) return { status: 'pending' };

    // Konsumsi atomik: hanya berhasil bila belum dikonsumsi pihak lain.
    const claimed = await this.prisma.waLoginRequest.updateMany({
      where: { token, consumedAt: null },
      data: { consumedAt: now },
    });
    if (claimed.count === 0) return { status: 'consumed' };

    const auth = await this.auth.loginByPhone(req.phone);
    return { status: 'ok', ...auth };
  }

  // Pesan WhatsApp yang sudah terisi (user tinggal kirim). Token dalam kurung
  // siku supaya mudah diparse inbound webhook.
  buildMessage(token: string): string {
    return `Halo POLKS, kirimkan link login untuk akun saya [${token}]`;
  }

  // Link balasan yang dikirim ke user lewat WhatsApp.
  buildLoginLink(token: string): string {
    const base = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3001';
    return `${base.replace(/\/$/, '')}/wa-login?r=${token}`;
  }

  private buildWaUrl(token: string): string {
    const raw =
      this.config.get<string>('WHATSAPP_BUSINESS_NUMBER') ||
      this.config.get<string>('TWILIO_WHATSAPP_FROM') ||
      '';
    const number = raw.replace(/[^\d]/g, ''); // wa.me butuh angka saja
    const text = encodeURIComponent(this.buildMessage(token));
    return `https://wa.me/${number}?text=${text}`;
  }
}
