-- DropForeignKey
ALTER TABLE "loyalty_config" DROP CONSTRAINT "loyalty_config_birthdayRewardId_fkey";

-- AlterTable
ALTER TABLE "loyalty_config" DROP COLUMN "birthdayEnabled",
DROP COLUMN "birthdayRewardId",
DROP COLUMN "birthdayVoucherDays";

-- AlterTable
ALTER TABLE "rewards" ADD COLUMN     "isBirthdayGift" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "birthday_config" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT NOT NULL DEFAULT 'Hadiah Ulang Tahun',
    "description" TEXT,
    "imageUrl" TEXT,
    "type" "RewardType" NOT NULL DEFAULT 'MANUAL',
    "value" INTEGER,
    "minPurchase" INTEGER,
    "freeItemName" TEXT,
    "voucherValidDays" INTEGER NOT NULL DEFAULT 7,
    "rewardId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "birthday_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "birthday_config_rewardId_key" ON "birthday_config"("rewardId");

-- AddForeignKey
ALTER TABLE "birthday_config" ADD CONSTRAINT "birthday_config_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "rewards"("id") ON DELETE SET NULL ON UPDATE CASCADE;
