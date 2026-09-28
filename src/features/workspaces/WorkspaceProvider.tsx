'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useWorkspaces } from './hooks/use-workspaces';
import type { WorkspaceSummary } from './types';

const STORAGE_KEY = 'active-workspace-id';

type WorkspaceContextValue = {
  workspaces: WorkspaceSummary[];
  active: WorkspaceSummary;
  setActiveWorkspaceId: (id: string) => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

function readSavedId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { data: workspaces, isPending, isError, refetch } = useWorkspaces();
  const [savedId, setSavedId] = useState<string | null>(readSavedId);

  // The saved id may be stale (access removed). Fall back to the first workspace.
  const active = useMemo(
    () => workspaces?.find((w) => w.workspaceId === savedId) ?? workspaces?.[0] ?? null,
    [workspaces, savedId]
  );

  const setActiveWorkspaceId = useCallback((id: string) => {
    setSavedId(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {}
  }, []);

  if (isPending) return <div className="p-8 text-sm text-slate-500">Loading workspace…</div>;

  if (isError) {
    return (
      <div className="p-8 text-sm text-red-600">
        Couldn’t load your workspaces.{' '}
        <button className="underline" onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  if (!workspaces || !active) {
    return <div className="p-8 text-sm text-slate-500">You don’t have access to any workspace yet.</div>;
  }

  return (
    <WorkspaceContext.Provider value={{ workspaces, active, setActiveWorkspaceId }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used inside <WorkspaceProvider>');
  return ctx;
}

/** Always a real id, because the provider doesn't render children until one exists. */
export function useActiveWorkspaceId() {
  return useWorkspace().active.workspaceId;
}