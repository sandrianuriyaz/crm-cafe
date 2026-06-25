-- Kode pemulihan 2FA (hash bcrypt, sekali pakai) — cadangan kalau authenticator hilang
ALTER TABLE "users" ADD COLUMN "twoFactorRecoveryCodes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
