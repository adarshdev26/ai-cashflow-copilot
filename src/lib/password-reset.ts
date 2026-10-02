import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { hashToken } from '@/lib/invitations';
import { hashPassword } from '@/lib/users';
import { sendPasswordResetEmail } from '@/lib/email';
import { SITE } from '@/content/marketing/site';

export const RESET_TTL_MINUTES = 30;
const MAX_REQUESTS_PER_HOUR = 3;

/**
 * Creates a token and "sends" the email.
 * Never throws for unknown emails and returns nothing, so callers can't leak whether the account exists.
 */
export async function requestPasswordReset(rawEmail: string): Promise<void> {
  const email = rawEmail.trim();

  // Emails aren't consistently lowercased in the DB, so match case-insensitively.
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    select: { id: true, email: true, name: true },
  });
  if (!user) return;

  // Simple rate limit: max 3 requests per user per hour (silently skipped after that).
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const recent = await prisma.passwordResetToken.count({
    where: { userId: user.id, createdAt: { gte: since } },
  });
  if (recent >= MAX_REQUESTS_PER_HOUR) return;

  const rawToken = randomBytes(32).toString('base64url');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000);

  // Only the newest link works: remove older unused tokens, then create the new one.
  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
    prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt } }),
  ]);

  const resetUrl = `${SITE.url}/reset-password?token=${encodeURIComponent(rawToken)}`;
  await sendPasswordResetEmail({
    to: user.email,
    name: user.name,
    resetUrl,
    expiresInMinutes: RESET_TTL_MINUTES,
  });
}

export type ResetResult = { ok: true } | { ok: false; reason: 'invalid' };

/** Validates the token, sets the new password, and burns the token, all in one transaction. */
export async function resetPasswordWithToken(rawToken: string, newPassword: string): Promise<ResetResult> {
  const tokenHash = hashToken(rawToken);
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  const now = new Date();

  if (!record || record.usedAt || record.expiresAt <= now) {
    return { ok: false, reason: 'invalid' };
  }

  const password = await hashPassword(newPassword);

  try {
    await prisma.$transaction(async (tx) => {
      // Atomic claim: if two requests race, only one gets count === 1.
      const claimed = await tx.passwordResetToken.updateMany({
        where: { id: record.id, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (claimed.count !== 1) throw new Error('TOKEN_ALREADY_USED');

      await tx.user.update({
        where: { id: record.userId },
        data: { password, passwordChangedAt: now },
      });

      // Kill any other outstanding links for this user.
      await tx.passwordResetToken.deleteMany({
        where: { userId: record.userId, usedAt: null },
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'TOKEN_ALREADY_USED') {
      return { ok: false, reason: 'invalid' };
    }
    throw err;
  }

  return { ok: true };
}