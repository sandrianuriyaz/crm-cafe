-- AlterEnum
ALTER TYPE "AuthTokenType" ADD VALUE 'EMAIL_CHANGE';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "pendingEmail" TEXT;
