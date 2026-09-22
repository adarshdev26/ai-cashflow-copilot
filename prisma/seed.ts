import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const categories = [
  { name: "Food & Dining", color: "#f97316" },
  { name: "Groceries", color: "#22c55e" },
  { name: "Rent", color: "#6366f1" },
  { name: "Utilities", color: "#0ea5e9" },
  { name: "Transport", color: "#eab308" },
  { name: "Shopping", color: "#ec4899" },
  { name: "Entertainment", color: "#a855f7" },
  { name: "Health", color: "#ef4444" },
  { name: "Education", color: "#14b8a6" },
  { name: "Travel", color: "#06b6d4" },
  { name: "Salary", color: "#16a34a" },
  { name: "Freelance", color: "#84cc16" },
  { name: "Investments", color: "#8b5cf6" },
  { name: "Other", color: "#64748b" },
];

async function main() {
  for (const c of categories) {
    await prisma.category.upsert({
      where: { name: c.name },       // name is @unique
      update: { color: c.color },
      create: c,
    });
  }
  console.log(`Seeded ${categories.length} categories`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());