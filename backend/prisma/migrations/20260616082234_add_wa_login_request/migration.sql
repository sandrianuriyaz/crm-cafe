-- CreateTable
CREATE TABLE "wa_login_requests" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "phone" TEXT,
    "claimedAt" TIMESTAMP(3),
    "consumedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wa_login_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wa_login_requests_token_key" ON "wa_login_requests"("token");

-- CreateIndex
CREATE INDEX "wa_login_requests_phone_idx" ON "wa_login_requests"("phone");
