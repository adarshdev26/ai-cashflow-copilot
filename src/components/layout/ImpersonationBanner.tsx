'use client';

import type { CurrentUser } from '@/features/auth/types';

export function ImpersonationBanner({ user }: { user?: CurrentUser | null }) {
  if (!user?.impersonating) return null;

  const handleExit = async () => {
    try {
      await fetch('/api/admin/impersonation/stop', { method: 'POST' });
      window.location.assign('/admin/users');
    } catch (error) {
      console.error('Failed to exit impersonation:', error);
    }
  };

  return (
    // In normal flow (not fixed): takes a fixed height, the rest of the page fills the remainder
    <div className="h-11 shrink-0 border-b border-primary/30 bg-primary/10">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-3 px-4 text-sm sm:px-6">
        <span className="truncate font-medium text-primary">
          Viewing as {user.email}
          {user.adminEmail ? ` · admin: ${user.adminEmail}` : ''}
        </span>
        <button
          type="button"
          onClick={() => void handleExit()}
          className="rounded-md border border-primary/30 bg-primary px-3 py-1.5 text-xs font-medium text-primary-content transition hover:opacity-90"
        >
          Exit
        </button>
      </div>
    </div>
  );
}