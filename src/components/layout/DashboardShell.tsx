'use client';

import Link from 'next/link';
import { useState, useCallback, useEffect, useSyncExternalStore, Suspense } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    WalletCards,
    Landmark,
    Settings,
    LogOut,
    Plus,
    ChevronsLeft,
    ChevronsRight,
    Compass,
    Tags,
    Repeat,
    LayoutTemplate,
    BarChart3,
    LifeBuoy,
    PiggyBank,
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
import { Select } from '@/components/ui/Select';
import { ImpersonationBanner } from '@/components/layout/ImpersonationBanner';
import { MobileTabBar, type MobileTabItem } from '@/components/layout/MobileTabBar';
import { PageTransitionOverlay } from '@/components/ui/PageTransitionOverlay';
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

const mobileTabs: MobileTabItem[] = [
    { name: 'Home', href: '/dashboard', icon: LayoutDashboard, exact: true },
    { name: 'Transactions', href: '/dashboard/transactions', icon: WalletCards },
    { name: 'Budgets', href: '/dashboard/budgets', icon: PiggyBank },
    { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
];

const mobileMoreItems: MobileTabItem[] = [
    { name: 'Recurring', href: '/dashboard/recurring', icon: Repeat },
    { name: 'Templates', href: '/dashboard/templates', icon: LayoutTemplate },
    { name: 'Accounts', href: '/dashboard/accounts', icon: Landmark },
    { name: 'Categories', href: '/dashboard/categories', icon: Tags },
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
                className="bg-base-100 border-base-300 w-full max-w-md rounded-xl border p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-workspace-title"
            >
                <h2 id="create-workspace-title" className="text-base-content text-lg font-semibold">
                    Create workspace
                </h2>
                <p className="text-base-content/60 mt-1 text-sm">
                    A workspace keeps its own transactions, habits and notes.
                </p>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div className="space-y-1">
                        <label
                            htmlFor="workspace-name"
                            className="text-base-content/80 text-xs font-medium"
                        >
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
                            className="border-base-300 focus:border-primary focus:ring-primary disabled:bg-base-200 w-full rounded-md border px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                        />
                        {error && (
                            <p className="text-error text-xs">
                                {error instanceof Error
                                    ? error.message
                                    : 'Failed to create workspace'}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isPending}
                            className="text-base-content/70 hover:bg-base-200 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!isValid || isPending}
                            className="bg-primary text-primary-content hover:bg-primary rounded-md px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
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
        <div
            className="flex min-w-0 items-center space-x-2 sm:space-x-3"
            data-tour="workspace-switcher"
        >
            {workspaces.length > 1 ? (
                <div className="w-40 min-w-0 sm:w-56">
                    <Select
                        value={active.workspaceId}
                        onChange={(e) => setActiveWorkspaceId(e.target.value)}
                        aria-label="Select workspace"
                    >
                        {workspaces.map((w) => {
                            const owner =
                                w.ownerEmail && w.ownerEmail === user?.email
                                    ? 'You'
                                    : (w.ownerEmail ?? 'No owner');
                            return (
                                <option key={w.workspaceId} value={w.workspaceId}>
                                    {`${w.name} (${owner})`}
                                </option>
                            );
                        })}
                    </Select>
                </div>
            ) : (
                <h2 className="text-base-content/80 max-w-[9rem] truncate text-sm font-semibold tracking-wide sm:max-w-none">
                    {active.name}
                </h2>
            )}
            <span
                data-tour="workspace-role"
                className="bg-base-200 text-base-content/70 border-base-300 hidden shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium sm:inline-block"
            >
                {active.role}
            </span>

            <button
                type="button"
                data-tour="new-workspace-btn"
                aria-label="New workspace"
                onClick={() => setIsCreateOpen(true)}
                className="border-base-300 text-base-content/70 hover:bg-base-200 hover:text-base-content flex shrink-0 items-center gap-1 rounded-md border p-1.5 text-xs font-medium whitespace-nowrap transition-colors sm:px-2.5 sm:py-1"
            >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">New workspace</span>
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
    } catch {}
    collapsedListeners.forEach((l) => l());
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
    const { setTheme } = useTheme();
    const { data: publicSettings } = usePublicSettings();
    const { data: preferences, isPlaceholderData: preferencesLoading } = useUserPreferences();
    const pathname = usePathname();
    const router = useRouter();
    const [isSignOutOpen, setIsSignOutOpen] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [signOutMessage, setSignOutMessage] = useState<string | null>(null);
    const defaultCollapsed = publicSettings?.['ui.sidebarCollapsedByDefault'] === true;
    const collapsed = useSyncExternalStore(
        subscribeCollapsed,
        () => getCollapsedSnapshot(defaultCollapsed),
        () => defaultCollapsed,
    );
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
        setCollapsedStored(!collapsed);
    }, [collapsed]);

    const { data: user, isLoading: isUserLoading } = useCurrentUser();

    const displayName = user?.name || user?.email?.split('@')[0] || 'User';
    const initial = displayName.charAt(0).toUpperCase();

    const handleSignOut = useCallback(async () => {
        if (isSigningOut) return;
        const isImpersonating = Boolean(user?.impersonating);
        setIsSigningOut(true);
        setSignOutMessage(isImpersonating ? 'Returning to admin…' : 'Signing out…');
        try {
            const endpoint = isImpersonating ? '/api/admin/impersonation/stop' : '/api/auth/logout';
            const redirectTo = '/admin/users';
            if (isImpersonating) router.prefetch(redirectTo);
            const response = await fetch(endpoint, { method: 'POST' });
            if (!response.ok) throw new Error('Failed to sign out');
            queryClient.removeQueries({
                predicate: (query) =>
                    query.queryKey[0] !== 'settings' || query.queryKey[1] !== 'public',
            });
            setIsSignOutOpen(false);
            router.push(redirectTo);
            notify.success(isImpersonating ? 'Exited impersonation' : 'Signed out');
        } catch (error) {
            setIsSigningOut(false);
            setSignOutMessage(null);
            console.error('Failed to sign out:', error);
            notify.error(getErrorMessage(error, 'Failed to sign out'));
        }
    }, [isSigningOut, queryClient, router, user]);

    const openSignOutDialog = useCallback(() => setIsSignOutOpen(true), []);
    const closeSignOutDialog = useCallback(() => setIsSignOutOpen(false), []);

    const startTour = useCallback(() => {
        router.push(tourHref('overview'));
    }, [router]);

    return (
        // Root = COLUMN: banner on top (fixed height), dashboard row below fills the rest.
        <div className="bg-base-200/50 flex h-screen flex-col overflow-hidden supports-[height:100dvh]:h-dvh">
            <ImpersonationBanner
                user={user}
                onExit={() => void handleSignOut()}
                isExiting={isSigningOut}
            />
            <Suspense fallback={null}>
                <OnboardingTour />
            </Suspense>

            {/* Dashboard row = remaining height (100vh - banner). Sidebar + main sit side by side in here. */}
            <div className="flex min-h-0 flex-1">
                {/* Desktop sidebar (hidden on mobile; mobile uses the bottom tab bar) */}
                <aside
                    className={`border-base-300 bg-base-100 hidden h-full w-64 shrink-0 flex-col border-r transition-[width] duration-200 ease-in-out md:flex ${collapsed ? 'md:w-18' : 'md:w-64'}`}
                >
                    <div
                        className={`border-base-200 flex items-center gap-2 border-b p-6 ${collapsed ? 'md:justify-center md:px-0' : ''}`}
                    >
                        <div className="bg-primary text-primary-content flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg font-bold">
                            A
                        </div>
                        <span
                            className={`text-base-content truncate text-lg font-semibold tracking-tight ${collapsed ? 'md:hidden' : ''}`}
                        >
                            {String(publicSettings?.['branding.name'] ?? 'Cashflow Copilot')}
                        </span>
                    </div>

                    <nav className="flex-1 space-y-1 overflow-y-auto p-4">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    data-tour={`nav-${item?.name?.toLowerCase()}`}
                                    title={collapsed ? item.name : undefined}
                                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${collapsed ? 'md:justify-center' : ''} ${
                                        isActive
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
                                    }`}
                                >
                                    <Icon
                                        className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary' : 'text-base-content/50'}`}
                                    />
                                    <span className={collapsed ? 'md:hidden' : ''}>
                                        {item.name}
                                    </span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="border-base-200 border-t p-4">
                        <div
                            data-tour={isUserLoading ? undefined : 'signed-in-user'}
                            className={`mb-3 flex items-center gap-3 px-3 py-2 ${collapsed ? 'md:justify-center md:px-0' : ''}`}
                        >
                            {isUserLoading ? (
                                <>
                                    <div className="bg-base-200 h-9 w-9 shrink-0 animate-pulse rounded-full" />
                                    <div
                                        className={`min-w-0 flex-1 space-y-1.5 ${collapsed ? 'md:hidden' : ''}`}
                                    >
                                        <div className="bg-base-200 h-3 w-24 animate-pulse rounded" />
                                        <div className="bg-base-200 h-3 w-32 animate-pulse rounded" />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                                        {initial}
                                    </div>
                                    <div
                                        className={`min-w-0 flex-1 ${collapsed ? 'md:hidden' : ''}`}
                                    >
                                        <p className="text-base-content truncate text-sm font-medium">
                                            {displayName}
                                        </p>
                                        {user?.email && (
                                            <p className="text-base-content/60 truncate text-xs">
                                                {user.email}
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                        <button
                            onClick={openSignOutDialog}
                            data-tour="sign-out"
                            title={collapsed ? 'Sign Out' : undefined}
                            className={`text-error hover:bg-error/10 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${collapsed ? 'md:justify-center' : ''}`}
                        >
                            <LogOut className="h-4 w-4 shrink-0" />
                            <span className={collapsed ? 'md:hidden' : ''}>Sign Out</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content Area */}
                <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                    <header className="border-base-300 bg-base-100 flex shrink-0 items-start justify-between gap-3 border-b px-4 pt-[calc(0.5rem+env(safe-area-inset-top))] pb-2 md:min-h-16 md:items-center md:px-8">
                        <div className="flex min-w-0 flex-1 items-center gap-x-3 gap-y-2 md:flex-nowrap">
                            <button
                                type="button"
                                onClick={toggleSidebar}
                                aria-label="Toggle sidebar"
                                aria-expanded={!collapsed}
                                className="text-base-content/60 hover:bg-base-200 hover:text-base-content hidden rounded-md p-2 transition-colors md:block"
                            >
                                {collapsed ? (
                                    <ChevronsRight className="border-base-300 h-7 w-7 rounded-lg border p-0.5" />
                                ) : (
                                    <ChevronsLeft className="border-base-300 h-7 w-7 rounded-lg border p-0.5" />
                                )}
                            </button>

                            <WorkspaceSelector />

                            <div
                                className="bg-base-300 hidden h-5 w-px md:block"
                                aria-hidden="true"
                            />

                            {/* Mobile: own row under the workspace. Desktop: inline, as before. */}
                            <div className="w-full min-w-0 md:w-auto">
                                <ActiveAccountSwitcher />
                            </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                            <ThemeMenu persistPreference />
                            {publicSettings?.['features.tourEnabled'] !== false && (
                                <button
                                    type="button"
                                    data-tour="take-tour"
                                    onClick={startTour}
                                    aria-label="Take a tour"
                                    className="btn btn-outline btn-sm gap-1.5"
                                >
                                    <Compass className="h-4 w-4" />
                                    <span className="hidden sm:inline">Take a tour</span>
                                </button>
                            )}
                        </div>
                    </header>

                    <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-8 md:pb-[calc(2rem+env(safe-area-inset-bottom))]">
                        {children}
                    </main>

                    <MobileTabBar
                        items={mobileTabs}
                        moreItems={mobileMoreItems}
                        user={{ name: displayName, email: user?.email }}
                        onSignOut={openSignOutDialog}
                    />
                </div>
            </div>

            {/* Reusable Confirmation Dialog for Sign Out */}
            <ConfirmDialog
                isOpen={isSignOutOpen}
                title={user?.impersonating ? 'Exit impersonation' : 'Sign Out'}
                description={
                    user?.impersonating
                        ? 'This will end the temporary user session and return you to the admin users page.'
                        : 'Are you sure you want to end your current session? You will need to log back in to access your dashboard.'
                }
                confirmText={user?.impersonating ? 'Exit' : 'Sign Out'}
                variant={user?.impersonating ? 'primary' : 'danger'}
                onConfirm={handleSignOut}
                onClose={closeSignOutDialog}
                loading={isSigningOut}
            />
            <PageTransitionOverlay
                isVisible={isSigningOut}
                message={signOutMessage ?? 'Signing out…'}
            />
        </div>
    );
}
