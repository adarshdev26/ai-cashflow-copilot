'use client';

import Link from 'next/link';
import { useState, useCallback, useSyncExternalStore } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Building2,
    Tags,
    Settings,
    LogOut,
    ChevronsLeft,
    ChevronsRight,
    Headset,
    FileText
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ThemeMenu } from '@/components/ui/ThemePicker';
import { notify, getErrorMessage } from '@/lib/ui/toast';
import { useAdminCurrentUser } from '@/features/admin';
import { usePublicSettings } from '@/features/settings/hooks/use-settings';
import { MobileTabBar, type MobileTabItem } from '@/components/layout/MobileTabBar';

const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Workspaces', href: '/admin/workspaces', icon: Building2 },
    { name: 'Categories', href: '/admin/categories', icon: Tags },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
    { name: 'Audit Logs', href: '/admin/audit-logs', icon: FileText },
    { name: 'Support Tickets', href: '/admin/support-tickets', icon: Headset },
];

const mobileTabs: MobileTabItem[] = [
    { name: 'Home', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Workspaces', href: '/admin/workspaces', icon: Building2 },
    { name: 'Tickets', href: '/admin/support-tickets', icon: Headset },
];

const mobileMoreItems: MobileTabItem[] = [
    { name: 'Categories', href: '/admin/categories', icon: Tags },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
];

const COLLAPSED_KEY = 'admin-sidebar-collapsed';
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
    collapsedListeners.forEach((listener) => listener());
}

export function AdminShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [signOutOpen, setSignOutOpen] = useState(false);
    const { data: publicSettings } = usePublicSettings();
    const brandName = String(publicSettings?.['branding.name'] ?? 'Cashflow Copilot');
    const defaultCollapsed = publicSettings?.['ui.sidebarCollapsedByDefault'] === true;
    const collapsed = useSyncExternalStore(
        subscribeCollapsed,
        () => getCollapsedSnapshot(defaultCollapsed),
        () => defaultCollapsed,
    );
    const { data: admin, isLoading } = useAdminCurrentUser();
    const displayName = admin?.name || admin?.email?.split('@')[0] || 'Admin';

    const toggleSidebar = useCallback(() => {
        setCollapsedStored(!collapsed);
    }, [collapsed]);

    const handleSignOut = useCallback(async () => {
        try {
            await fetch('/api/admin/auth/logout', { method: 'POST' });
            queryClient.clear();
            router.replace('/admin/login');
            router.refresh();
        } catch (error) {
            notify.error(getErrorMessage(error, 'Failed to sign out'));
        }
    }, [router, queryClient]);

    return (
        <div className="bg-base-200/50 flex h-screen overflow-hidden supports-[height:100dvh]:h-dvh">
            {/* Desktop sidebar (hidden on mobile; mobile uses the bottom tab bar) */}
            <aside
                className={`border-base-300 bg-base-100 hidden h-full w-64 shrink-0 flex-col border-r transition-[width] duration-200 md:flex ${collapsed ? 'md:w-18' : 'md:w-64'}`}
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
                        {brandName}
                    </span>
                </div>
                <nav className="flex-1 space-y-1 overflow-y-auto p-4">
                    {navigation.map((item) => {
                        const active =
                            pathname === item.href || pathname.startsWith(`${item.href}/`);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                title={collapsed ? item.name : undefined}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${collapsed ? 'md:justify-center' : ''} ${active ? 'bg-primary/10 text-primary' : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'}`}
                            >
                                <Icon
                                    className={`h-4 w-4 shrink-0 ${active ? 'text-primary' : 'text-base-content/50'}`}
                                />
                                <span className={collapsed ? 'md:hidden' : ''}>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
                <div className="border-base-200 border-t p-4">
                    <div
                        className={`mb-3 flex items-center gap-3 px-3 py-2 ${collapsed ? 'md:justify-center md:px-0' : ''}`}
                    >
                        {isLoading ? (
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
                                    {displayName.charAt(0).toUpperCase()}
                                </div>
                                <div className={`min-w-0 flex-1 ${collapsed ? 'md:hidden' : ''}`}>
                                    <p className="text-base-content truncate text-sm font-medium">
                                        {displayName}
                                    </p>
                                    {admin?.email && (
                                        <p className="text-base-content/60 truncate text-xs">
                                            {admin.email}
                                        </p>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => setSignOutOpen(true)}
                        title={collapsed ? 'Sign out' : undefined}
                        className={`text-error hover:bg-error/10 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${collapsed ? 'md:justify-center' : ''}`}
                    >
                        <LogOut className="h-4 w-4 shrink-0" />
                        <span className={collapsed ? 'md:hidden' : ''}>Sign out</span>
                    </button>
                </div>
            </aside>

            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                <header className="border-base-300 bg-base-100 flex min-h-16 shrink-0 items-center justify-between gap-3 border-b px-4 pt-[calc(0.5rem+env(safe-area-inset-top))] pb-2 md:px-8">
                    <div className="flex min-w-0 items-center gap-2">
                        {/* Desktop: sidebar toggle */}
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

                        {/* Mobile: brand (sidebar is hidden here) */}
                        <Link
                            href="/admin/dashboard"
                            className="flex min-w-0 items-center gap-2 md:hidden"
                        >
                            <span className="bg-primary text-primary-content flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg font-bold">
                                A
                            </span>
                            <span className="text-base-content truncate text-base font-semibold tracking-tight">
                                {brandName}
                            </span>
                        </Link>
                    </div>
                    <div className="shrink-0">
                        <ThemeMenu />
                    </div>
                </header>

                <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-8 md:pb-[calc(2rem+env(safe-area-inset-bottom))]">
                    {children}
                </main>

                <MobileTabBar
                    items={mobileTabs}
                    moreItems={mobileMoreItems}
                    user={{ name: displayName, email: admin?.email }}
                    onSignOut={() => setSignOutOpen(true)}
                />
            </div>
            <ConfirmDialog
                isOpen={signOutOpen}
                title="Sign out"
                description="End your admin session?"
                confirmText="Sign out"
                variant="danger"
                onConfirm={handleSignOut}
                onClose={() => setSignOutOpen(false)}
            />
        </div>
    );
}
