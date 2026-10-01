'use client';

import Link from 'next/link';
import { useState, useCallback, useEffect, useSyncExternalStore, Suspense } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, WalletCards, Landmark, CheckSquare, FileText, Settings, LogOut, Plus,
  Menu, X, ChevronsLeft, ChevronsRight, Compass, Tags, Repeat, LayoutTemplate
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useCurrentUser } from '@/features/auth';
import { useWorkspace, useCreateWorkspace } from '@/features/workspaces';
import { notify, getErrorMessage } from '@/lib/toast';
import { OnboardingTour } from '@/features/onboarding/components/OnboardingTour';
import { tourHref } from '@/features/onboarding/lib/tour-steps';
import { ActiveAccountSwitcher } from '@/features/accounts';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Transactions', href: '/dashboard/transactions', icon: WalletCards },
  { name: 'Recurring', href: '/dashboard/recurring', icon: Repeat },
  { name: 'Templates', href: '/dashboard/templates', icon: LayoutTemplate },
  { name: 'Budgets', href: '/dashboard/budgets', icon: WalletCards },
  { name: 'Accounts', href: '/dashboard/accounts', icon: Landmark },
  { name: 'Categories', href: '/dashboard/categories', icon: Tags },
  { name: 'Habits', href: '/dashboard/habits', icon: CheckSquare },
  { name: 'Notes', href: '/dashboard/notes', icon: FileText },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

function CreateWorkspaceModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (workspaceId: string) => void;
}) {
  const [name, setName] = useState('');
  const { mutate: createWs, isPending, error, reset } = useCreateWorkspace();

  if (!isOpen) return null;

  const trimmed = name.trim();
  const isValid = trimmed.length >= 2 && trimmed.length <= 60;

  const handleClose = () => {
    if (isPending) return;
    setName('');
    reset();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isPending) return;
    createWs(trimmed, {
      onSuccess: (data) => {
        setName('');
        onCreated(data.workspace.workspaceId);
      },
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-workspace-title"
      >
        <h2 id="create-workspace-title" className="text-lg font-semibold text-slate-900">
          Create workspace
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          A workspace keeps its own transactions, habits and notes.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1">
            <label htmlFor="workspace-name" className="text-xs font-medium text-slate-700">
              Workspace name
            </label>
            <input
              id="workspace-name"
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
              maxLength={60}
              placeholder="e.g. Family Budget"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50"
            />
            {error && (
              <p className="text-xs text-red-600">
                {error instanceof Error ? error.message : 'Failed to create workspace'}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || isPending}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function WorkspaceSelector() {
  const { workspaces, active, setActiveWorkspaceId } = useWorkspace();
  const { data: user } = useCurrentUser();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="flex items-center space-x-3" data-tour="workspace-switcher">
      {workspaces.length > 1 ? (
        <select
          className="text-sm font-semibold text-slate-700 bg-transparent border-none focus:ring-0 p-0 cursor-pointer"
          value={active.workspaceId}
          onChange={(e) => setActiveWorkspaceId(e.target.value)}
          aria-label="Select workspace"
        >
          {workspaces.map((w) => (
            <option key={w.workspaceId} value={w.workspaceId}>
              {w.name} ({w.ownerEmail && w.ownerEmail === user?.email ? 'You' : (w.ownerEmail ?? 'No owner')})
            </option>
          ))}
        </select>
      ) : (
        <h2 className="text-sm font-semibold text-slate-700 tracking-wide">{active.name}</h2>
      )}
      <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-full border border-slate-200">
        {active.role}
      </span>

      <button
        type="button"
        data-tour="new-workspace-btn"
        onClick={() => setIsCreateOpen(true)}
        className="flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        New workspace
      </button>

      <CreateWorkspaceModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(workspaceId) => {
          setActiveWorkspaceId(workspaceId);
          setIsCreateOpen(false);
          notify.success('Workspace created');
        }}
      />
    </div>
  );
}

const COLLAPSED_KEY = 'sidebar-collapsed';
const collapsedListeners = new Set<() => void>();

function subscribeCollapsed(cb: () => void) {
  collapsedListeners.add(cb);
  window.addEventListener('storage', cb);
  return () => {
    collapsedListeners.delete(cb);
    window.removeEventListener('storage', cb);
  };
}

function getCollapsedSnapshot() {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === 'true';
  } catch {
    return false;
  }
}

function setCollapsedStored(next: boolean) {
  try {
    localStorage.setItem(COLLAPSED_KEY, String(next));
  } catch { }
  collapsedListeners.forEach((l) => l());
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSignOutOpen, setIsSignOutOpen] = useState(false);
  const collapsed = useSyncExternalStore(subscribeCollapsed, getCollapsedSnapshot, () => false);
  const [mobileOpen, setMobileOpen] = useState(false); // mobile drawer
  const queryClient = useQueryClient();

  const toggleSidebar = useCallback(() => {
    if (window.matchMedia('(min-width: 768px)').matches) {
      setCollapsedStored(!collapsed);
    } else {
      setMobileOpen((open) => !open);
    }
  }, [collapsed]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  // Escape closes the mobile drawer.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  const { data: user, isLoading: isUserLoading } = useCurrentUser();

  const displayName = user?.name || user?.email?.split('@')[0] || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  const handleSignOut = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      queryClient.clear();
      router.push('/login');
      router.refresh();
      notify.success('Signed out');
    } catch (error) {
      console.error('Failed to sign out:', error);
      notify.error(getErrorMessage(error, 'Failed to sign out'));
    }
  }, [router, queryClient]);

  const openSignOutDialog = useCallback(() => setIsSignOutOpen(true), []);
  const closeSignOutDialog = useCallback(() => setIsSignOutOpen(false), []);

  const startTour = useCallback(() => {
    setMobileOpen(false);
    router.push(tourHref('overview'));
  }, [router]);

  return (
    <div className="h-screen overflow-hidden bg-slate-50/50 flex">
      <Suspense fallback={null}>
        <OnboardingTour />
      </Suspense>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 md:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 flex flex-col border-r border-slate-200 bg-white transition-[transform,width] duration-200 ease-in-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'
          } md:static md:z-auto md:translate-x-0 md:h-full ${collapsed ? 'md:w-18' : 'md:w-64'}`}
      >
        <div className={`p-6 border-b border-slate-100 flex items-center gap-2 ${collapsed ? 'md:justify-center md:px-0' : ''}`}>
          <div className="h-8 w-8 shrink-0 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
            A
          </div>
          <span className={`font-semibold text-lg tracking-tight text-slate-900 ${collapsed ? 'md:hidden' : ''}`}>
            CashFlow Copilot
          </span>
          <button
            type="button"
            onClick={closeMobile}
            aria-label="Close menu"
            className="ml-auto rounded-md p-1.5 text-slate-500 hover:bg-slate-100 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                data-tour={`nav-${item?.name?.toLowerCase()}`}
                onClick={closeMobile}
                title={collapsed ? item.name : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${collapsed ? 'md:justify-center' : ''} ${isActive
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className={collapsed ? 'md:hidden' : ''}>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className={`mb-3 flex items-center gap-3 px-3 py-2 ${collapsed ? 'md:justify-center md:px-0' : ''}`}>
            {isUserLoading ? (
              <>
                <div className="h-9 w-9 shrink-0 rounded-full bg-slate-100 animate-pulse" />
                <div className={`min-w-0 flex-1 space-y-1.5 ${collapsed ? 'md:hidden' : ''}`}>
                  <div className="h-3 w-24 rounded bg-slate-100 animate-pulse" />
                  <div className="h-3 w-32 rounded bg-slate-100 animate-pulse" />
                </div>
              </>
            ) : (
              <>
                <div className="h-9 w-9 shrink-0 rounded-full bg-indigo-50 flex items-center justify-center text-sm font-semibold text-indigo-600">
                  {initial}
                </div>
                <div className={`min-w-0 flex-1 ${collapsed ? 'md:hidden' : ''}`}>
                  <p className="truncate text-sm font-medium text-slate-900">{displayName}</p>
                  {user?.email && <p className="truncate text-xs text-slate-500">{user.email}</p>}
                </div>
              </>
            )}
          </div>
          <button
            onClick={openSignOutDialog}
            title={collapsed ? 'Sign Out' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors ${collapsed ? 'md:justify-center' : ''}`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className={collapsed ? 'md:hidden' : ''}>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <header className="h-16 shrink-0 border-b border-slate-200 bg-white px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
              aria-expanded={mobileOpen || !collapsed}
              className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <Menu className="h-5 w-5 md:hidden" />
              {collapsed ? (
                <ChevronsRight className="hidden h-7 w-7 border rounded-lg border-slate-300 p-0.5 md:block" />
              ) : (
                <ChevronsLeft className="hidden h-7 w-7 border rounded-lg border-slate-300 p-0.5 md:block" />
              )}
            </button>
            <WorkspaceSelector />
            <div className="hidden h-5 w-px bg-slate-200 sm:block" aria-hidden="true" />
            <ActiveAccountSwitcher />
          </div>

          <button
            type="button"
            onClick={startTour}
            className="flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <Compass className="h-4 w-4" />
            <span className="hidden sm:inline">Take a tour</span>
          </button>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Reusable Confirmation Dialog for Sign Out */}
      <ConfirmDialog
        isOpen={isSignOutOpen}
        title="Sign Out"
        description="Are you sure you want to end your current session? You will need to log back in to access your dashboard."
        confirmText="Sign Out"
        variant="danger"
        onConfirm={handleSignOut}
        onClose={closeSignOutDialog}
      />
    </div>
  );
}