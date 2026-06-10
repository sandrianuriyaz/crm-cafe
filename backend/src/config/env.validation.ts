import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('7d'),

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
