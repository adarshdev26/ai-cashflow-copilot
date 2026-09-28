import { PrismaClient } from '../src/generated/prisma'; // adjust to your generated client path

const prisma = new PrismaClient();

const EMAIL = 'developer@gmail.com';
const MONTHS_BACK = 6;
const SEED_TAG = '[seed]'; // marker so re-runs are detectable and cleanup is easy

const EXPENSES: { category: string; description: string; min: number; max: number }[] = [
  { category: 'Groceries', description: 'Supermarket', min: 300, max: 2500 },
  { category: 'Rent', description: 'Monthly rent', min: 12000, max: 12000 },
  { category: 'Transport', description: 'Fuel / cab', min: 100, max: 900 },
  { category: 'Dining', description: 'Restaurant', min: 250, max: 1800 },
  { category: 'Utilities', description: 'Electricity / internet', min: 500, max: 2200 },
  { category: 'Entertainment', description: 'Movies / subscriptions', min: 150, max: 1200 },
  { category: 'Health', description: 'Pharmacy / clinic', min: 200, max: 3000 },
];

const rand = (min: number, max: number) => Math.round(min + Math.random() * (max - min));
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

function randomDateWithinMonths(months: number) {
  const now = Date.now();
  return new Date(now - Math.random() * months * 30 * 24 * 60 * 60 * 1000);
}

function buildTransactions(workspaceId: string, userId: string) {
  const rows: any[] = [];

  // Monthly salary
  for (let m = 0; m < MONTHS_BACK; m++) {
    const d = new Date();
    d.setMonth(d.getMonth() - m, 1);
    rows.push({
      workspaceId,
      userId,
      type: 'INCOME',
      amount: 60000,
      category: 'Salary',
      description: `${SEED_TAG} Monthly salary`,
      date: d,
    });
  }

  // Random freelance income
  for (let i = 0; i < 4; i++) {
    rows.push({
      workspaceId,
      userId,
      type: 'INCOME',
      amount: rand(3000, 15000),
      category: 'Freelance',
      description: `${SEED_TAG} Freelance payment`,
      date: randomDateWithinMonths(MONTHS_BACK),
    });
  }

  // Random expenses
  for (let i = 0; i < 60; i++) {
    const e = pick(EXPENSES);
    rows.push({
      workspaceId,
      userId,
      type: 'EXPENSE',
      amount: rand(e.min, e.max),
      category: e.category,
      description: `${SEED_TAG} ${e.description}`,
      date: randomDateWithinMonths(MONTHS_BACK),
    });
  }

  return rows;
}

async function main() {
  const user = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (!user) throw new Error(`User ${EMAIL} not found`);

  const access = await prisma.workspaceAccess.findMany({
    where: { userId: user.id },
    include: { workspace: { select: { id: true, name: true } } },
  });

  console.log(`Found ${access.length} workspace(s) for ${EMAIL}`);

  for (const a of access) {
    const { id, name } = a.workspace;

    // Idempotent: skip workspaces that were already seeded
    const existing = await prisma.transaction.count({
      where: { workspaceId: id, description: { startsWith: SEED_TAG } },
    });
    if (existing > 0) {
      console.log(`- ${name}: already seeded (${existing} rows), skipping`);
      continue;
    }

    const rows = buildTransactions(id, user.id);
    const res = await prisma.transaction.createMany({ data: rows });
    console.log(`- ${name}: inserted ${res.count} transactions`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());