import { prisma } from '@/lib/db/prisma';

const BATCH = 500;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Deletes expired or long-used reset tokens, at most BATCH rows per run. */
export async function cleanupResetTokens(): Promise<number> {
    const now = new Date();
    const usedBefore = new Date(now.getTime() - DAY_MS);

    const stale = await prisma.passwordResetToken.findMany({
        where: { OR: [{ expiresAt: { lt: now } }, { usedAt: { lt: usedBefore } }] },
        select: { id: true },
        take: BATCH,
    });
    if (stale.length === 0) return 0;

    const { count } = await prisma.passwordResetToken.deleteMany({
        where: { id: { in: stale.map((r) => r.id) } },
    });
    return count;
}
