CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE', 'ARCHIVED');
CREATE TYPE "GoalContributionKind" AS ENUM ('ADD', 'REMOVE');

CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetAmount" DOUBLE PRECISION NOT NULL,
    "currentAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "status" "GoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GoalContribution" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "kind" "GoalContributionKind" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GoalContribution_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Goal_workspaceId_status_targetDate_idx"
    ON "Goal"("workspaceId", "status", "targetDate");
CREATE INDEX "Goal_workspaceId_createdAt_idx"
    ON "Goal"("workspaceId", "createdAt");
CREATE INDEX "GoalContribution_goalId_createdAt_idx"
    ON "GoalContribution"("goalId", "createdAt");

ALTER TABLE "Goal"
    ADD CONSTRAINT "Goal_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GoalContribution"
    ADD CONSTRAINT "GoalContribution_goalId_fkey"
    FOREIGN KEY ("goalId") REFERENCES "Goal"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;