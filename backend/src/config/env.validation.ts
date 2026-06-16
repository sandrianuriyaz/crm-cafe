import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),
  // Opsional: belum dipakai di kode. Disediakan untuk fitur antrian/cache nanti.
  REDIS_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Origin frontend yang diizinkan CORS (pisah koma). Kosong = izinkan semua
  // (cocok untuk dev). Production: isi domain frontend, mis. https://app.polks.id
  CORS_ORIGIN: z.string().optional(),

  // URL dasar frontend, untuk bangun link balasan login WhatsApp.
  FRONTEND_URL: z.string().url().default('http://localhost:3001'),
  // Nomor WhatsApp bisnis tujuan wa.me (E.164 tanpa +). Default dari nomor Twilio.
  WHATSAPP_BUSINESS_NUMBER: z.string().optional(),
  // Validasi X-Twilio-Signature inbound webhook. 'true' = aktif (production).
  WHATSAPP_VERIFY_SIGNATURE: z.string().optional(),

  // ── Integrasi POS Fase 1 ──────────────────────────────────────────────
  // Shared secret HMAC-SHA256 dengan POS (header X-Signature). Lihat §6.
  CRM_WEBHOOK_SECRET: z.string().min(16),
  // Aturan poin (§8): poin = floor(grand_total / POIN_PER_RUPIAH).
  POIN_PER_RUPIAH: z.coerce.number().int().positive().default(1000),
  // Konversi tukar poin: 1 poin = POIN_NILAI_RUPIAH rupiah (dipakai Fase 2).
  POIN_NILAI_RUPIAH: z.coerce.number().int().positive().default(1000),

  // ── OTP login (Twilio WhatsApp/SMS) ───────────────────────────────────
  // Opsional saat boot; divalidasi saat benar-benar mengirim OTP. Tanpa ini
  // endpoint /auth/otp/request akan menolak dengan error konfigurasi.
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_WHATSAPP_FROM: z.string().optional(), // mis. +14155238886
  TWILIO_SMS_FROM: z.string().optional(), // mis. +14155238886
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    throw new Error(
      `❌ Env tidak valid:\n${JSON.stringify(parsed.error.format(), null, 2)}`,
    );
  }
  return parsed.data;
}
