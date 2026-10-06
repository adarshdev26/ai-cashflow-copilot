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

function WorkspaceSkeleton() {
    return (
        <div
            className="bg-base-200 flex min-h-screen animate-pulse"
            aria-busy="true"
            aria-label="Loading workspace"
        >
            {/* Sidebar */}
            <aside className="border-base-300 bg-base-100 hidden w-64 shrink-0 space-y-6 border-r p-4 md:block">
                <div className="flex items-center gap-3">
                    <div className="bg-base-300 h-9 w-9 rounded-lg" />
                    <div className="bg-base-300 h-4 w-28 rounded" />
                </div>
                <div className="space-y-2">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 rounded-lg px-2 py-2">
                            <div className="bg-base-300 h-5 w-5 rounded" />
                            <div
                                className="bg-base-300 h-3.5 rounded"
                                style={{ width: `${55 + ((i * 17) % 35)}%` }}
                            />
                        </div>
                    ))}
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 space-y-6 p-6 md:p-8">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="bg-base-300 h-6 w-48 rounded" />
                        <div className="bg-base-300 h-3.5 w-72 rounded" />
                    </div>
                    <div className="bg-base-300 h-10 w-32 rounded-lg" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div
                            key={i}
                            className="border-base-300 bg-base-100 space-y-3 rounded-xl border p-5"
                        >
                            <div className="bg-base-300 h-3.5 w-24 rounded" />
                            <div className="bg-base-300 h-7 w-32 rounded" />
                            <div className="bg-base-300 h-3 w-20 rounded" />
                        </div>
                    ))}
                </div>

                <div className="border-base-300 bg-base-100 space-y-3 rounded-xl border p-5">
                    <div className="bg-base-300 h-4 w-40 rounded" />
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4 py-2">
                            <div className="bg-base-300 h-8 w-8 rounded-full" />
                            <div className="bg-base-300 h-3.5 flex-1 rounded" />
                            <div className="bg-base-300 h-3.5 w-20 rounded" />
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
    const { data: workspaces, isPending, isError, refetch } = useWorkspaces();
    const [savedId, setSavedId] = useState<string | null>(readSavedId);

    // The saved id may be stale (access removed). Fall back to the first workspace.
    const active = useMemo(
        () => workspaces?.find((w) => w.workspaceId === savedId) ?? workspaces?.[0] ?? null,
        [workspaces, savedId],
    );

    const setActiveWorkspaceId = useCallback((id: string) => {
        setSavedId(id);
        try {
            localStorage.setItem(STORAGE_KEY, id);
        } catch {}
    }, []);

    if (isPending) return <WorkspaceSkeleton />;

    if (isError) {
        return (
            <div className="text-error p-8 text-sm">
                Couldn’t load your workspaces.{' '}
                <button className="underline" onClick={() => refetch()}>
                    Retry
                </button>
            </div>
        );
    }

    if (!workspaces || !active) {
        return (
            <div className="text-base-content/60 p-8 text-sm">
                You don’t have access to any workspace yet.
            </div>
        );
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
