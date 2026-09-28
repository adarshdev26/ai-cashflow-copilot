/*
  Seeds realistic transactions for one user, linked to real categories.

  Usage (from project root):
    npx tsx prisma/seed-transactions.ts you@email.com
    npx tsx prisma/seed-transactions.ts you@email.com --clear     # wipe that workspace's transactions first

  The user is picked by (in order):
    1. the email passed as the first argument
    2. SEED_USER_EMAIL from .env
    3. the only user in the DB (errors out if there are several)

  Run the category seed first - this script reads category ids from the DB.
*/
import "dotenv/config";
import { Prisma, PrismaClient, TransactionType } from "../src/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ---- Config ---------------------------------------------------------------
const MONTHS_BACK = 6; // how far back the data goes (current month included)
const RANDOM_DEBITS = 45; // extra one-off expenses on top of the monthly ones
const RANDOM_FREELANCE = 40;
const RANDOM_INVESTMENTS = 30;
const DEFAULT_WORKSPACE_NAME = "Personal";

// ---- CLI ------------------------------------------------------------------
const args = process.argv.slice(2);
const shouldClear = args.includes("--clear");
const emailArg = args.find((a) => !a.startsWith("--")) ?? process.env.SEED_USER_EMAIL;

// ---- Helpers --------------------------------------------------------------
const now = new Date();

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(items: T[]): T => items[rand(0, items.length - 1)];

/** A date `monthsAgo` months back on the given day (clamped to 28), at a random time. */
function dateInMonth(monthsAgo: number, day: number): Date {
  return new Date(now.getFullYear(), now.getMonth() - monthsAgo, Math.min(day, 28), rand(8, 21), rand(0, 59));
}

/** A random date within the last MONTHS_BACK months, never in the future. */
function randomRecentDate(): Date {
  const span = MONTHS_BACK * 30 * 24 * 60 * 60 * 1000;
  return new Date(now.getTime() - rand(0, span));
}

const isPast = (d: Date) => d.getTime() <= now.getTime();

// ---- Templates for one-off expenses --------------------------------------
type DebitTemplate = {
  category: string;
  descriptions: string[];
  min: number;
  max: number;
  weight: number; // higher = shows up more often
};

const debitTemplates: DebitTemplate[] = [
  { category: "Food & Dining", descriptions: ["Zomato order", "Swiggy dinner", "Cafe coffee", "Lunch with colleagues", "Pizza night"], min: 150, max: 1200, weight: 10 },
  { category: "Groceries", descriptions: ["BigBasket order", "Blinkit groceries", "Vegetable market", "DMart monthly stock"], min: 300, max: 3500, weight: 8 },
  { category: "Transport", descriptions: ["Uber ride", "Ola cab", "Metro card recharge", "Petrol", "Auto fare"], min: 60, max: 1800, weight: 8 },
  { category: "Shopping", descriptions: ["Amazon order", "Myntra clothes", "Flipkart purchase", "New headphones"], min: 400, max: 6000, weight: 5 },
  { category: "Entertainment", descriptions: ["Netflix subscription", "Movie tickets", "Spotify Premium", "Game purchase"], min: 149, max: 1500, weight: 4 },
  { category: "Health", descriptions: ["Pharmacy", "Doctor consultation", "Gym membership", "Lab tests"], min: 200, max: 3000, weight: 3 },
  { category: "Education", descriptions: ["Online course", "Books", "Workshop fee"], min: 400, max: 4000, weight: 2 },
  { category: "Travel", descriptions: ["Train tickets", "Flight booking", "Hotel stay", "Weekend trip"], min: 800, max: 12000, weight: 2 },
  { category: "Other", descriptions: ["Miscellaneous expense", "Gift", "ATM withdrawal"], min: 100, max: 2000, weight: 2 },
];

const weightedDebitPool = debitTemplates.flatMap((t) => Array<DebitTemplate>(t.weight).fill(t));

// ---- DB lookups -----------------------------------------------------------
async function resolveUser(email?: string) {
  if (email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error(`No user found with email "${email}".`);
    return user;
  }

  const users = await prisma.user.findMany({ take: 2, orderBy: { createdAt: "asc" } });
  if (users.length === 0) throw new Error("No users in the database. Register a user first.");
  if (users.length > 1) {
    throw new Error(
      "Multiple users found. Pass an email: npx tsx prisma/seed-transactions.ts you@email.com"
    );
  }
  return users[0];
}

async function resolveWorkspace(userId: string) {
  // Workspaces are found via WorkspaceAccess (the new model has no Workspace.userId).
  const access = await prisma.workspaceAccess.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: { workspace: true },
  });
  if (access) return access.workspace;

  // No workspace found — create a default one as OWNER.
  const { generateWorkspaceSlug } = await import("../src/lib/workspaces");
  return prisma.workspace.create({
    data: {
      name: DEFAULT_WORKSPACE_NAME,
      slug: generateWorkspaceSlug(DEFAULT_WORKSPACE_NAME),
      ownerId: userId,
      access: { create: { userId, role: "OWNER" } },
    },
  });
}

async function loadCategoryIds() {
  const categories = await prisma.category.findMany();
  if (categories.length === 0) {
    throw new Error("No categories found. Run the category seed first.");
  }
  const byName = new Map(categories.map((c) => [c.name, c.id]));

  return (name: string): string => {
    const id = byName.get(name);
    if (!id) throw new Error(`Category "${name}" not found in the database. Run the category seed first.`);
    return id;
  };
}

// ---- Main -----------------------------------------------------------------
async function main() {
  const user = await resolveUser(emailArg);
  const workspace = await resolveWorkspace(user.id);
  const categoryId = await loadCategoryIds();

  console.log(`User:      ${user.email}`);
  console.log(`Workspace: ${workspace.name} (${workspace.id})`);

  const rows: Prisma.TransactionCreateManyInput[] = [];

  const add = (
    type: TransactionType,
    category: string,
    description: string,
    amount: number,
    createdAt: Date
  ) => {
    if (!isPast(createdAt)) return;
    rows.push({
      workspaceId: workspace.id,
      categoryId: categoryId(category),
      type,
      description,
      amount,
      createdAt,
      updatedAt: createdAt,
    });
  };

  // Monthly recurring items
  for (let m = 0; m < MONTHS_BACK; m++) {
    add("CREDIT", "Other", "Monthly salary", 65000, dateInMonth(m, 1));
    add("DEBIT", "Other", "House rent", 15000, dateInMonth(m, 5));
    add("DEBIT", "Other", "Electricity bill", rand(900, 2500), dateInMonth(m, 10));
    add("DEBIT", "Other", "Internet bill", 799, dateInMonth(m, 12));
  }

  // Irregular income
  for (let i = 0; i < RANDOM_FREELANCE; i++) {
    add("CREDIT", "Other", "Freelance project payment", rand(5000, 30000), randomRecentDate());
  }
  for (let i = 0; i < RANDOM_INVESTMENTS; i++) {
    add(
      "CREDIT",
      "Other",
      pick(["Mutual fund returns", "Stock dividend", "FD interest credit"]),
      rand(500, 6000),
      randomRecentDate()
    );
  }

  // One-off expenses
  for (let i = 0; i < RANDOM_DEBITS; i++) {
    const t = pick(weightedDebitPool);
    add("DEBIT", t.category, pick(t.descriptions), rand(t.min, t.max), randomRecentDate());
  }

  rows.sort((a, b) => (a.createdAt as Date).getTime() - (b.createdAt as Date).getTime());

  if (shouldClear) {
    const { count } = await prisma.transaction.deleteMany({ where: { workspaceId: workspace.id } });
    console.log(`Cleared ${count} existing transactions`);
  }

  const result = await prisma.transaction.createMany({ data: rows });

  const credit = rows.filter((r) => r.type === "CREDIT").reduce((sum, r) => sum + r.amount, 0);
  const debit = rows.filter((r) => r.type === "DEBIT").reduce((sum, r) => sum + r.amount, 0);

  console.log(`Seeded ${result.count} transactions`);
  console.log(`  Credit: ${credit.toLocaleString()}   Debit: ${debit.toLocaleString()}`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());