-- One "General" account per workspace (including empty ones)
INSERT INTO "financial_accounts"
  ("id","workspaceId","name","type","currency","openingBalance","isActive","createdAt","updatedAt")
SELECT gen_random_uuid()::text, w."id", 'General', 'OTHER'::"AccountType",
       w."currency", 0, true, NOW(), NOW()
FROM "Workspace" w
WHERE NOT EXISTS (
  SELECT 1 FROM "financial_accounts" a
  WHERE a."workspaceId" = w."id" AND a."name" = 'General'
);

-- Assign each workspace's transactions to its OWN workspace's account
UPDATE "Transaction" t
SET "accountId" = a."id"
FROM "financial_accounts" a
WHERE a."workspaceId" = t."workspaceId"
  AND a."name" = 'General'
  AND t."accountId" IS NULL;