-- CreateEnum
CREATE TYPE "RewardStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "VoucherStatus" AS ENUM ('ACTIVE', 'USED', 'EXPIRED');

-- CreateTable
CREATE TABLE "rewards" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "pointCost" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "status" "RewardStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vouchers" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "status" "VoucherStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiredAt" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redeems" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "voucherId" TEXT NOT NULL,
    "pointsSpent" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "redeems_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vouchers_code_key" ON "vouchers"("code");

-- CreateIndex
CREATE INDEX "vouchers_memberId_idx" ON "vouchers"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "redeems_voucherId_key" ON "redeems"("voucherId");

-- CreateIndex
CREATE INDEX "redeems_memberId_idx" ON "redeems"("memberId");

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "rewards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redeems" ADD CONSTRAINT "redeems_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redeems" ADD CONSTRAINT "redeems_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "rewards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redeems" ADD CONSTRAINT "redeems_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "vouchers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
