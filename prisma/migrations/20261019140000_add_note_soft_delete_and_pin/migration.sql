-- Add soft-delete (deletedAt) and pin (isPinned) columns to Note table
ALTER TABLE "Note" ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "isPinned" BOOLEAN NOT NULL DEFAULT false;

-- Index for efficient soft-delete filtering
CREATE INDEX "Note_workspaceId_deletedAt_idx" ON "Note"("workspaceId", "deletedAt");

-- Index for pinned notes queries
CREATE INDEX "Note_workspaceId_isPinned_idx" ON "Note"("workspaceId", "isPinned");
