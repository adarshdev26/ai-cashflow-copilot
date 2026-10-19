-- CreateTable
CREATE TABLE "OauthAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OauthAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OauthAccount_provider_providerAccountId_key" ON "OauthAccount"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "OauthAccount_userId_provider_key" ON "OauthAccount"("userId", "provider");

-- CreateIndex
CREATE INDEX "OauthAccount_userId_idx" ON "OauthAccount"("userId");

-- AddForeignKey
ALTER TABLE "OauthAccount" ADD CONSTRAINT "OauthAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
