-- 2FA berbasis TOTP (authenticator app) untuk akun login email/password
ALTER TABLE "users" ADD COLUMN "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "twoFactorSecret" TEXT;
