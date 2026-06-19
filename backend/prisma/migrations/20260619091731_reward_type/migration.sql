-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('DISCOUNT_AMOUNT', 'DISCOUNT_PERCENT', 'FREE_ITEM', 'MANUAL');

-- AlterTable
ALTER TABLE "rewards" ADD COLUMN     "freeItemName" TEXT,
ADD COLUMN     "type" "RewardType" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "value" INTEGER;
