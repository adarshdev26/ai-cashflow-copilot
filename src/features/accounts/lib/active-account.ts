'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { useActiveWorkspaceId } from '@/features/workspaces';
import { useAccounts } from '../hooks/use-accounts';

const listeners = new Set<() => void>();
const storageKey = (workspaceId: string) => `active-account:${workspaceId}`;

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener('storage', cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', cb);
  };
}

function read(workspaceId: string): string | null {
  try {
    return localStorage.getItem(storageKey(workspaceId)) || null;
  } catch {
    return null;
  }
}

function write(workspaceId: string, accountId: string | null) {
  try {
    if (accountId) localStorage.setItem(storageKey(workspaceId), accountId);
    else localStorage.removeItem(storageKey(workspaceId));
  } catch { }
  listeners.forEach((l) => l());
}

/** null = "All accounts". Remembered per workspace. */
export function useActiveAccountId(): [string | null, (id: string | null) => void] {
  const workspaceId = useActiveWorkspaceId();
  const stored = useSyncExternalStore(
    subscribe,
    () => read(workspaceId),
    () => null
  );
  const { data: accounts } = useAccounts(workspaceId);

  // Once accounts are loaded, ignore a stored id that no longer exists (deleted account).
  const activeAccountId = accounts && stored && !accounts.some((a) => a.id === stored) ? null : stored;

  const setActiveAccountId = useCallback(
    (id: string | null) => write(workspaceId, id),
    [workspaceId]
  );

  return [activeAccountId, setActiveAccountId];
}