'use client';

import Link from 'next/link';
import { useState, useCallback, useEffect, useSyncExternalStore, Suspense } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, WalletCards, Landmark, Settings, LogOut, Plus, Menu, X,
  ChevronsLeft, ChevronsRight, Compass, Tags, Repeat, LayoutTemplate,
  BarChart3, LifeBuoy
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useCurrentUser } from '@/features/auth';
import { useWorkspace, useCreateWorkspace } from '@/features/workspaces';
import { notify, getErrorMessage } from '@/lib/ui/toast';
import { OnboardingTour } from '@/features/onboarding/components/OnboardingTour';
import { tourHref } from '@/features/onboarding/lib/tour-steps';
import { ActiveAccountSwitcher } from '@/features/accounts';
import { ThemeMenu } from '@/components/ui/ThemePicker';
import { ImpersonationBanner } from '@/components/layout/ImpersonationBanner';
import { useTheme } from 'next-themes';
import { usePublicSettings, useUserPreferences } from '@/features/settings/hooks/use-settings';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Transactions', href: '/dashboard/transactions', icon: WalletCards },
  { name: 'Recurring', href: '/dashboard/recurring', icon: Repeat },
  { name: 'Templates', href: '/dashboard/templates', icon: LayoutTemplate },
  { name: 'Budgets', href: '/dashboard/budgets', icon: WalletCards },
  { name: 'Accounts', href: '/dashboard/accounts', icon: Landmark },
  { name: 'Categories', href: '/dashboard/categories', icon: Tags },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'Support', href: '/dashboard/support', icon: LifeBuoy },
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
  const { data: publicSettings } = usePublicSettings();

  if (!isOpen) return null;

  const trimmed = name.trim();
  const minNameLength = Number(publicSettings?.['limits.workspaceNameMinLength'] ?? 2);
  const maxNameLength = Number(publicSettings?.['limits.workspaceNameMaxLength'] ?? 60);
  const isValid = trimmed.length >= minNameLength && trimmed.length <= maxNameLength;

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-base-100 p-6 shadow-xl border border-base-300"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-workspace-title"
      >
        <h2 id="create-workspace-title" className="text-lg font-semibold text-base-content">
          Create workspace
        </h2>
        <p className="mt-1 text-sm text-base-content/60">
          A workspace keeps its own transactions, habits and notes.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1">
            <label htmlFor="workspace-name" className="text-xs font-medium text-base-content/80">
              Workspace name
            </label>
            <input
              id="workspace-name"
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
              minLength={minNameLength}
              maxLength={maxNameLength}
              placeholder="e.g. Family Budget"
              className="w-full rounded-md border border-base-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-base-200"
            />
            {error && (
              <p className="text-xs text-error">
                {error instanceof Error ? error.message : 'Failed to create workspace'}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="rounded-md px-4 py-2 text-sm font-medium text-base-content/70 hover:bg-base-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-content hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
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
          className="text-sm font-semibold text-base-content/80 bg-transparent border-none focus:ring-0 p-0 cursor-pointer"
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
        <h2 className="text-sm font-semibold text-base-content/80 tracking-wide">{active.name}</h2>
      )}
      <span data-tour="workspace-role" className="px-2 py-0.5 text-xs font-medium bg-base-200 text-base-content/70 rounded-full border border-base-300">
        {active.role}
      </span>

      <button
        type="button"
        data-tour="new-workspace-btn"
        onClick={() => setIsCreateOpen(true)}
        className="flex items-center gap-1 rounded-md border border-base-300 px-2.5 py-1 text-xs font-medium text-base-content/70 hover:bg-base-200 hover:text-base-content transition-colors"
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

function getCollapsedSnapshot(defaultCollapsed: boolean) {
  try {
    const stored = localStorage.getItem(COLLAPSED_KEY);
    return stored === null ? defaultCollapsed : stored === 'true';
  } catch {
    return defaultCollapsed;
  }
}

function setCollapsedStored(next: boolean) {
  try {
    localStorage.setItem(COLLAPSED_KEY, String(next));
  } catch { }
  collapsedListeners.forEach((l) => l());
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { setTheme } = useTheme();
  const { data: publicSettings } = usePublicSettings();
  const { data: preferences, isPlaceholderData: preferencesLoading } = useUserPreferences();
  const pathname = usePathname();
  const router = useRouter();
  const [isSignOutOpen, setIsSignOutOpen] = useState(false);
  const defaultCollapsed = publicSettings?.['ui.sidebarCollapsedByDefault'] === true;
  const collapsed = useSyncExternalStore(subscribeCollapsed, () => getCollapsedSnapshot(defaultCollapsed), () => defaultCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false); // mobile drawer
  const queryClient = useQueryClient();

  useEffect(() => {
    if (preferencesLoading) return;
    try {
      if (!window.localStorage.getItem('app-theme')) {
        setTheme(String(preferences?.theme ?? 'system'));
      }
    } catch {
      setTheme(String(preferences?.theme ?? 'system'));
    }
  }, [preferences, preferencesLoading, setTheme]);

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
      const endpoint = user?.impersonating ? '/api/admin/impersonation/stop' : '/api/auth/logout';
      const redirectTo = user?.impersonating ? '/admin/users' : '/login';
      await fetch(endpoint, { method: 'POST' });
      queryClient.clear();
      router.push(redirectTo);
      notify.success(user?.impersonating ? 'Exited impersonation' : 'Signed out');
    } catch (error) {
      console.error('Failed to sign out:', error);
      notify.error(getErrorMessage(error, 'Failed to sign out'));
    }
  }, [queryClient, router, user]);

  const openSignOutDialog = useCallback(() => setIsSignOutOpen(true), []);
  const closeSignOutDialog = useCallback(() => setIsSignOutOpen(false), []);

  const startTour = useCallback(() => {
    setMobileOpen(false);
    router.push(tourHref('overview'));
  }, [router]);

  return (
    // Root = COLUMN: banner on top (fixed height), dashboard row below fills the rest.
    <div className="h-screen supports-[height:100dvh]:h-dvh overflow-hidden bg-base-200/50 flex flex-col">
      <ImpersonationBanner user={user} />
      <Suspense fallback={null}>
        <OnboardingTour />
      </Suspense>

      {/* Dashboard row = remaining height (100vh - banner). Sidebar + main sit side by side in here. */}
      <div className="flex flex-1 min-h-0">
        {/* Mobile backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={closeMobile}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 flex flex-col border-r border-base-300 bg-base-100 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] transition-[transform,width] duration-200 ease-in-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'
            } md:static md:z-auto md:translate-x-0 md:h-full ${collapsed ? 'md:w-18' : 'md:w-64'}`}
        >
          <div className={`p-6 border-b border-base-200 flex items-center gap-2 ${collapsed ? 'md:justify-center md:px-0' : ''}`}>
            <div className="h-8 w-8 shrink-0 rounded-lg bg-primary flex items-center justify-center text-primary-content font-bold text-lg">
              A
            </div>
            <span className={`font-semibold text-lg tracking-tight text-base-content ${collapsed ? 'md:hidden' : ''}`}>
              {String(publicSettings?.['branding.name'] ?? 'Cashflow Copilot')}
            </span>
            <button
              type="button"
              onClick={closeMobile}
              aria-label="Close menu"
              className="ml-auto rounded-md p-1.5 text-base-content/60 hover:bg-base-200 md:hidden"
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
                    ? 'bg-primary/10 text-primary'
                    : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
                    }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary' : 'text-base-content/50'}`} />
                  <span className={collapsed ? 'md:hidden' : ''}>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-base-200">
            <div data-tour={isUserLoading ? undefined : 'signed-in-user'} className={`mb-3 flex items-center gap-3 px-3 py-2 ${collapsed ? 'md:justify-center md:px-0' : ''}`}>
              {isUserLoading ? (
                <>
                  <div className="h-9 w-9 shrink-0 rounded-full bg-base-200 animate-pulse" />
                  <div className={`min-w-0 flex-1 space-y-1.5 ${collapsed ? 'md:hidden' : ''}`}>
                    <div className="h-3 w-24 rounded bg-base-200 animate-pulse" />
                    <div className="h-3 w-32 rounded bg-base-200 animate-pulse" />
                  </div>
                </>
              ) : (
                <>
                  <div className="h-9 w-9 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                    {initial}
                  </div>
                  <div className={`min-w-0 flex-1 ${collapsed ? 'md:hidden' : ''}`}>
                    <p className="truncate text-sm font-medium text-base-content">{displayName}</p>
                    {user?.email && <p className="truncate text-xs text-base-content/60">{user.email}</p>}
                  </div>
                </>
              )}
            </div>
            <button
              onClick={openSignOutDialog}
              data-tour="sign-out"
              title={collapsed ? 'Sign Out' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-error hover:bg-error/10 transition-colors ${collapsed ? 'md:justify-center' : ''}`}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className={collapsed ? 'md:hidden' : ''}>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <header className="min-h-16 shrink-0 border-b border-base-300 bg-base-100 px-4 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))] md:px-8 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={toggleSidebar}
                aria-label="Toggle sidebar"
                aria-expanded={mobileOpen || !collapsed}
                className="rounded-md p-2 text-base-content/60 hover:bg-base-200 hover:text-base-content transition-colors"
              >
                <Menu className="h-5 w-5 md:hidden" />
                {collapsed ? (
                  <ChevronsRight className="hidden h-7 w-7 border rounded-lg border-base-300 p-0.5 md:block" />
                ) : (
                  <ChevronsLeft className="hidden h-7 w-7 border rounded-lg border-base-300 p-0.5 md:block" />
                )}
              </button>
              <WorkspaceSelector />
              <div className="hidden h-5 w-px bg-base-300 sm:block" aria-hidden="true" />
              <ActiveAccountSwitcher />
            </div>

            <div className="flex items-center gap-2">
            <ThemeMenu persistPreference />
              {publicSettings?.['features.tourEnabled'] !== false && (
                <button type="button" data-tour="take-tour" onClick={startTour} className="btn btn-outline btn-sm gap-1.5">
                  <Compass className="h-4 w-4" />
                  <span className="hidden sm:inline">Take a tour</span>
                </button>
              )}
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:p-8 md:pb-[calc(2rem+env(safe-area-inset-bottom))]">
            {children}
          </main>
        </div>
      </div>

      {/* Reusable Confirmation Dialog for Sign Out */}
      <ConfirmDialog
        isOpen={isSignOutOpen}
        title={user?.impersonating ? 'Exit impersonation' : 'Sign Out'}
        description={user?.impersonating
          ? 'This will end the temporary user session and return you to the admin users page.'
          : 'Are you sure you want to end your current session? You will need to log back in to access your dashboard.'}
        confirmText={user?.impersonating ? 'Exit' : 'Sign Out'}
        variant={user?.impersonating ? 'primary' : 'danger'}
        onConfirm={handleSignOut}
        onClose={closeSignOutDialog}
      />
    </div>
  );
}
