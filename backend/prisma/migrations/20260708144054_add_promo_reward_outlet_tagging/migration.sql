-- CreateTable
CREATE TABLE "promo_outlets" (
    "id" TEXT NOT NULL,
    "promoId" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,

    CONSTRAINT "promo_outlets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reward_outlets" (
    "id" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,

    CONSTRAINT "reward_outlets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "promo_outlets_promoId_outletId_key" ON "promo_outlets"("promoId", "outletId");

-- CreateIndex
CREATE UNIQUE INDEX "reward_outlets_rewardId_outletId_key" ON "reward_outlets"("rewardId", "outletId");

-- AddForeignKey
ALTER TABLE "promo_outlets" ADD CONSTRAINT "promo_outlets_promoId_fkey" FOREIGN KEY ("promoId") REFERENCES "promos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_outlets" ADD CONSTRAINT "promo_outlets_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "outlets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_outlets" ADD CONSTRAINT "reward_outlets_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "rewards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_outlets" ADD CONSTRAINT "reward_outlets_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "outlets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
