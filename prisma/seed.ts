import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const categories = [
  { name: "Food & Dining", color: null },
  { name: "Groceries", color: null },
  { name: "Transport", color: null },
  { name: "Shopping", color: null },
  { name: "Entertainment", color: null },
  { name: "Health", color: null },
  { name: "Education", color: null },
  { name: "Travel", color: null },
  { name: "Other", color: null },
];

async function main() {
  for (const c of categories) {
    await prisma.category.upsert({
      where: { name: c.name },
      update: { color: c.color },
      create: c,
    });
  }
  console.log(`Seeded ${categories.length} categories`);

  const demoEmail = 'demo@example.com';
  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      email: demoEmail,
      password: 'notarealhash',
      role: 'USER',
    },
  });

  const workspaceName = 'Demo Workspace';
  const { generateWorkspaceSlug } = await import('../src/lib/workspaces');
  
  const existingAccess = await prisma.workspaceAccess.findFirst({
    where: { userId: user.id },
  });

  if (!existingAccess) {
    await prisma.workspace.create({
      data: {
        name: workspaceName,
        slug: generateWorkspaceSlug(workspaceName),
        ownerId: user.id,
        access: {
          create: {
            userId: user.id,
            role: 'OWNER',
          },
        },
      },
    });
    console.log('Created demo user and workspace');
  } else {
    console.log('Demo user and workspace already exist');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());