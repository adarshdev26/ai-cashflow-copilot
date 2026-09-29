import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

/**
 * Returns the user only if the cookie is valid AND the user still exists in the DB.
 * cache() means multiple calls in one request (page + layout) hit the DB once.
 */
export const getValidUser = cache(async () => {
  const session = await getSession(); // null when missing, expired or tampered
  if (!session) return null;

  return prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true },
  });
});

/**
 * Same as getValidUser, plus onboardingCompletedAt.
 * Used by the onboarding layout and the dashboard layout guard.
 */
export const getValidUserWithOnboarding = cache(async () => {
  const session = await getSession();
  if (!session) return null;

  return prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, onboardingCompletedAt: true },
  });
});