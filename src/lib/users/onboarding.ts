import { prisma } from '@/lib/db/prisma';
import type { OnboardingSetupInput } from '@/lib/validations/onboarding';

/**
 * Saves the workspace name/currency and the user's goal together.
 * Both writes succeed or neither does. The slug is intentionally not changed.
 */
export async function saveOnboardingSetup(params: {
  userId: string;
  workspaceId: string;
  input: OnboardingSetupInput;
}) {
  const { userId, workspaceId, input } = params;

  const [workspace] = await prisma.$transaction([
    prisma.workspace.update({
      where: { id: workspaceId },
      data: { name: input.name, currency: input.currency },
      select: { id: true, name: true, currency: true },
    }),
    prisma.user.update({
      where: { id: userId },
      data: input.primaryGoal === undefined ? {} : { primaryGoal: input.primaryGoal },
      select: { id: true },
    }),
  ]);

  return { workspaceId: workspace.id, name: workspace.name, currency: workspace.currency };
}

/**
 * Marks onboarding as done. Only writes when it is still null, so calling it
 * again is harmless and the first completion time is kept.
 */
export async function completeOnboarding(userId: string) {
  await prisma.user.updateMany({
    where: { id: userId, onboardingCompletedAt: null },
    data: { onboardingCompletedAt: new Date() },
  });
}