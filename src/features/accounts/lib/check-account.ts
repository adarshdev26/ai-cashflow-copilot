import { prisma } from '@/lib/db/prisma';

/**
 * Returns an error message, or null when the account is usable.
 * Always scoped by workspaceId, so another workspace's account looks like a missing one.
 */
export async function getAccountError(
  workspaceId: string,
  accountId: string,
  opts: { requireActive: boolean }
): Promise<string | null> {
  const account = await prisma.financialAccount.findFirst({
    where: { id: accountId, workspaceId },
    select: { isActive: true },
  });
  if (!account) return 'Invalid account';
  if (opts.requireActive && !account.isActive) return 'Account is inactive';
  return null;
}