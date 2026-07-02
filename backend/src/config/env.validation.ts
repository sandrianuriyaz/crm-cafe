import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
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

  // URL dasar frontend, untuk redirect callback Google OAuth
  // (${FRONTEND_URL}/auth/callback?token=...).
  FRONTEND_URL: z.string().url().default('http://localhost:3001'),

  // Google OAuth (login via akun Google). Opsional saat boot; wajib agar
  // /auth/google benar-benar berfungsi.
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().url().optional(),

  // Supabase Storage (upload gambar promo/reward). Opsional saat boot; wajib
  // agar POST /admin/uploads berfungsi. Bucket harus publik.
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_BUCKET: z.string().default('uploads'),

  // ── SMTP (email transaksional: reset password & verifikasi email) ──────
  // Semua opsional saat boot. Bila SMTP_HOST kosong, MailService tidak
  // benar-benar mengirim — email hanya di-log ke console (mode dev).
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  // Alamat pengirim yang tampil di email (mis. "POLKS <no-reply@polks.id>").
  MAIL_FROM: z.string().default('POLKS <no-reply@polks.id>'),

  // ── Integrasi POS Fase 1 ──────────────────────────────────────────────
  // Shared secret HMAC-SHA256 dengan POS (header X-Signature). Lihat §6.
  CRM_WEBHOOK_SECRET: z.string().min(16),
  // Aturan poin (§8): poin = floor(grand_total / POIN_PER_RUPIAH).
  POIN_PER_RUPIAH: z.coerce.number().int().positive().default(1000),
  // Konversi tukar poin: 1 poin = POIN_NILAI_RUPIAH rupiah (dipakai Fase 2).
  POIN_NILAI_RUPIAH: z.coerce.number().int().positive().default(1000),
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
