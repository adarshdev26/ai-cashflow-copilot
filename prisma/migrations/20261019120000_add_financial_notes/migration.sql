-- CreateEnum
CREATE TYPE "NoteCategory" AS ENUM ('GENERAL', 'BUDGET', 'INVESTMENT', 'TAX', 'EXPENSE');

-- CreateEnum
CREATE TYPE "NotePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" "NoteCategory" NOT NULL DEFAULT 'GENERAL',
    "priority" "NotePriority" NOT NULL DEFAULT 'MEDIUM',
    "amount" DOUBLE PRECISION,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Note_workspaceId_createdAt_idx" ON "Note"("workspaceId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Note_workspaceId_isCompleted_idx" ON "Note"("workspaceId", "isCompleted");

-- CreateIndex
CREATE INDEX "Note_userId_idx" ON "Note"("userId");

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
