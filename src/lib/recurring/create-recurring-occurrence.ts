import { prisma } from '@/lib/db/prisma';
import { collectDueOccurrences } from '@/lib/recurring/recurring-dates';
import { getAccountError } from "@/features/accounts/lib/check-account";
import { getCategoryError } from '@/lib/categories';
import type { RecurringTransaction } from '@/generated/prisma';
import { getSystemNumber } from '@/lib/settings/server';

async function targetError(s: RecurringTransaction): Promise<string | null> {
  const a = await getAccountError(s.workspaceId, s.accountId, { requireActive: true });
  if (a) return a;
  if (s.categoryId) {
    return getCategoryError(s.categoryId, s.workspaceId, { type: s.type, requireActive: true });
  }
  return null;
}

export async function processSchedule(s: RecurringTransaction, now: Date) {
  const error = await targetError(s);
  if (error) {
    // Conditional: don't clobber a user edit that moved nextRunAt meanwhile.
    await prisma.recurringTransaction.updateMany({
      where: { id: s.id, nextRunAt: s.nextRunAt },
      data: { lastError: error },
    });
    return { generated: 0, skipped: true };
  }

  const due = collectDueOccurrences({
    startDate: s.startDate,
    frequency: s.frequency,
    nextRunAt: s.nextRunAt,
    endDate: s.endDate,
    now,
    limit: await getSystemNumber('limits.recurringCatchupPerRun'),
  });
  if (due.occurrences.length === 0 && !due.finished) return { generated: 0, skipped: false };

  const generated = await prisma.$transaction(async (tx) => {
    const claim = await tx.recurringTransaction.updateMany({
      where: { id: s.id, isActive: true, nextRunAt: s.nextRunAt },
      data: {
        nextRunAt: due.nextRunAt,
        lastRunAt: now,
        lastError: null,
        isActive: !due.finished,
      },
    });
    if (claim.count === 0) return 0;

    const res = await tx.transaction.createMany({
      data: due.occurrences.map((d) => ({
        workspaceId: s.workspaceId,
        accountId: s.accountId,
        categoryId: s.categoryId,
        amount: s.amount,
        type: s.type,
        description: s.description,
        recurringTransactionId: s.id,
        occurrenceDate: d,
        createdAt: d,
      })),
      skipDuplicates: true,
    });
    return res.count;
  });

  return { generated, skipped: false };
}
