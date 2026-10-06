import type { InvitableRole } from './types';

export const ROLE_LABELS: Record<InvitableRole, string> = {
    ADMIN: 'Admin',
    MEMBER: 'Member',
    VIEWER: 'Viewer',
};

/** Browser only. Called after a user action, never during server render. */
export function buildInviteUrl(token: string): string {
    return `${window.location.origin}/invite/${token}`;
}

/** "Expires in 3h 20m", "Expires in 12m", or "Expired". */
export function formatTimeLeft(expiresAt: string, now: number): string {
    const ms = new Date(expiresAt).getTime() - now;
    if (ms <= 0) return 'Expired';
    const hours = Math.floor(ms / 3_600_000);
    const minutes = Math.floor((ms % 3_600_000) / 60_000);
    if (hours > 0) return `Expires in ${hours}h ${minutes}m`;
    if (minutes > 0) return `Expires in ${minutes}m`;
    return 'Expires in less than 1m';
}

export const ACTIVE_WORKSPACE_KEY = 'active-workspace-id';

/** Makes the joined workspace the active one. Storage can be unavailable, so never throw. */
export function setActiveWorkspaceId(workspaceId: string): void {
    try {
        window.localStorage.setItem(ACTIVE_WORKSPACE_KEY, workspaceId);
    } catch {
        // Ignore: the app falls back to its default workspace.
    }
}
