-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "apiKeyHash" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'free',
    "mawLimit" INTEGER NOT NULL DEFAULT 1000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "authMethod" TEXT NOT NULL,
    "displayName" TEXT,
    "profileImage" TEXT,
    "googleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeyShare" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shareData" TEXT NOT NULL,
    "shareIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KeyShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpCode" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnRampOrder" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "fiatAmount" DECIMAL(20,8) NOT NULL,
    "fiatCurrency" TEXT NOT NULL,
    "cryptoAmount" DECIMAL(30,18) NOT NULL,
    "cryptoAsset" TEXT NOT NULL,
    "chain" TEXT NOT NULL,
    "destinationAddress" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "rate" DECIMAL(30,18) NOT NULL,
    "serviceFee" DECIMAL(20,8) NOT NULL,
    "networkFee" DECIMAL(20,8) NOT NULL,
    "paymentReference" TEXT,
    "txHash" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "OnRampOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OffRampOrder" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "cryptoAmount" DECIMAL(30,18) NOT NULL,
    "cryptoAsset" TEXT NOT NULL,
    "chain" TEXT NOT NULL,
    "fiatAmount" DECIMAL(20,8) NOT NULL,
    "fiatCurrency" TEXT NOT NULL,
    "payoutMethod" TEXT NOT NULL,
    "payoutDetails" JSONB NOT NULL,
    "rate" DECIMAL(30,18) NOT NULL,
    "serviceFee" DECIMAL(20,8) NOT NULL,
    "networkFee" DECIMAL(20,8) NOT NULL,
    "depositAddress" TEXT,
    "txHash" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "OffRampOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_apiKey_key" ON "Project"("apiKey");

-- CreateIndex
CREATE INDEX "Project_apiKey_idx" ON "Project"("apiKey");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_projectId_idx" ON "User"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "User_projectId_email_key" ON "User"("projectId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "KeyShare_userId_key" ON "KeyShare"("userId");

-- CreateIndex
CREATE INDEX "KeyShare_userId_idx" ON "KeyShare"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_refreshToken_key" ON "Session"("refreshToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_refreshToken_idx" ON "Session"("refreshToken");

-- CreateIndex
CREATE INDEX "OtpCode_email_idx" ON "OtpCode"("email");

-- CreateIndex
CREATE INDEX "OtpCode_expiresAt_idx" ON "OtpCode"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "OnRampOrder_paymentReference_key" ON "OnRampOrder"("paymentReference");

-- CreateIndex
CREATE INDEX "OnRampOrder_userId_idx" ON "OnRampOrder"("userId");

-- CreateIndex
CREATE INDEX "OnRampOrder_projectId_idx" ON "OnRampOrder"("projectId");

-- CreateIndex
CREATE INDEX "OnRampOrder_status_idx" ON "OnRampOrder"("status");

-- CreateIndex
CREATE INDEX "OnRampOrder_createdAt_idx" ON "OnRampOrder"("createdAt");

-- CreateIndex
CREATE INDEX "OffRampOrder_userId_idx" ON "OffRampOrder"("userId");

-- CreateIndex
CREATE INDEX "OffRampOrder_projectId_idx" ON "OffRampOrder"("projectId");

-- CreateIndex
CREATE INDEX "OffRampOrder_status_idx" ON "OffRampOrder"("status");

-- CreateIndex
CREATE INDEX "OffRampOrder_createdAt_idx" ON "OffRampOrder"("createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeyShare" ADD CONSTRAINT "KeyShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnRampOrder" ADD CONSTRAINT "OnRampOrder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnRampOrder" ADD CONSTRAINT "OnRampOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OffRampOrder" ADD CONSTRAINT "OffRampOrder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OffRampOrder" ADD CONSTRAINT "OffRampOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
