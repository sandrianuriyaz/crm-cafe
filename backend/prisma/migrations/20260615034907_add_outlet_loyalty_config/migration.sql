-- CreateEnum
CREATE TYPE "OutletStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "outlets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "address" TEXT,
    "hours" TEXT,
    "phone" TEXT,
    "status" "OutletStatus" NOT NULL DEFAULT 'ACTIVE',
    "storeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outlets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_config" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "rupiahPerPoint" INTEGER NOT NULL DEFAULT 1000,
    "pointsPerUnit" INTEGER NOT NULL DEFAULT 1,
    "pointExpiryMonths" INTEGER,
    "tierThresholds" JSONB NOT NULL DEFAULT '[]',
    "webhookUrl" TEXT,
    "requireIdempotencyKeys" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "outlets_storeId_key" ON "outlets"("storeId");
