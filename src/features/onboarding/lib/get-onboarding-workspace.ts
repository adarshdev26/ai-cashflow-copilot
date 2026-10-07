/**
 * The workspace onboarding configures: the first one the user OWNS.
 *
 * Invited users have two workspaces (their own Personal + the one they were
 * invited to), and the "active" one may be the invited one where they are only
 * MEMBER/ADMIN. Invitations can never grant OWNER, so role === 'OWNER' always
 * means "this is mine". /api/workspaces returns oldest first, so this is Personal.
 */
export function getOnboardingWorkspace<T extends { role: string }>(
    workspaces: T[] | undefined,
): T | undefined {
    return workspaces?.find((w) => w.role === 'OWNER');
}
