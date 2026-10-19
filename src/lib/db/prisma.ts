import { PrismaClient } from '@/generated/prisma';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

interface PrismaWithRuntime {
    note?: unknown;
    _runtimeDataModel?: {
        models?: {
            Note?: {
                fields?: Array<{ name: string }>;
            };
        };
    };
}

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL is required to connect to the database.');
}

const adapter = new PrismaNeon({ connectionString });

const cachedPrisma = globalForPrisma.prisma;
// In dev, hot-reloading may retain a PrismaClient instance from before schema updates.
// Re-instantiate if note model or newly added fields (isPinned, deletedAt) are missing on the cached client.
const clientWithRuntime = cachedPrisma as unknown as PrismaWithRuntime | undefined;
const noteFields = clientWithRuntime?._runtimeDataModel?.models?.Note?.fields;
const hasNote = Boolean(clientWithRuntime?.note);
const hasPinAndDeletedAt = Boolean(
    noteFields?.some((f) => f.name === 'isPinned') &&
        noteFields?.some((f) => f.name === 'deletedAt'),
);

const isStale = Boolean(cachedPrisma && (!hasNote || !hasPinAndDeletedAt));

export const prisma =
    cachedPrisma && !isStale
        ? cachedPrisma
        : new PrismaClient({
              adapter,
              // log: ['query'],
          });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
