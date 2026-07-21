-- AlterTable
ALTER TABLE "loyalty_config" ADD COLUMN     "birthdayEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "birthdayRewardId" TEXT,
ADD COLUMN     "birthdayVoucherDays" INTEGER NOT NULL DEFAULT 7;

-- CreateTable
CREATE TABLE "birthday_grants" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "voucherId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "birthday_grants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "birthday_grants_voucherId_key" ON "birthday_grants"("voucherId");

-- CreateIndex
CREATE UNIQUE INDEX "birthday_grants_memberId_year_key" ON "birthday_grants"("memberId", "year");

-- AddForeignKey
ALTER TABLE "loyalty_config" ADD CONSTRAINT "loyalty_config_birthdayRewardId_fkey" FOREIGN KEY ("birthdayRewardId") REFERENCES "rewards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "birthday_grants" ADD CONSTRAINT "birthday_grants_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "birthday_grants" ADD CONSTRAINT "birthday_grants_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "vouchers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
