'use client';

import type { CurrentUser } from '@/features/auth/types';

export function ImpersonationBanner({
    user,
    onExit,
    isExiting,
}: {
    user?: CurrentUser | null;
    onExit: () => void;
    isExiting: boolean;
}) {
    if (!user?.impersonating) return null;

    return (
        // In normal flow (not fixed): takes a fixed height, the rest of the page fills the remainder
        <div className="border-primary/30 bg-primary/10 h-11 shrink-0 border-b">
            <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-3 px-4 text-sm sm:px-6">
                <span className="text-primary truncate font-medium">
                    Viewing as {user.email}
                    {user.adminEmail ? ` · admin: ${user.adminEmail}` : ''}
                </span>
                <button
                    type="button"
                    onClick={onExit}
                    disabled={isExiting}
                    className="border-primary/30 bg-primary text-primary-content rounded-md border px-3 py-1.5 text-xs font-medium transition hover:opacity-90 disabled:cursor-wait disabled:opacity-50"
                >
                    {isExiting ? 'Exiting…' : 'Exit'}
                </button>
            </div>
        </div>
    );
}
