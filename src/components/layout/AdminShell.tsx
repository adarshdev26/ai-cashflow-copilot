'use client';

import Link from 'next/link';
import { useState, useCallback, useEffect, useSyncExternalStore } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Building2, Tags, Settings, LogOut, Menu, X, ChevronsLeft, ChevronsRight, Headset } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ThemeMenu } from '@/components/ui/ThemePicker';
import { notify, getErrorMessage } from '@/lib/ui/toast';
import { useAdminCurrentUser } from '@/features/admin';
import { usePublicSettings } from '@/features/settings/hooks/use-settings';

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Workspaces', href: '/admin/workspaces', icon: Building2 },
  { name: 'Categories', href: '/admin/categories', icon: Tags },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
  { name: 'Support Tickets', href: '/admin/support-tickets', icon: Headset },
];
const COLLAPSED_KEY = 'admin-sidebar-collapsed';
const collapsedListeners = new Set<() => void>();

function subscribeCollapsed(cb: () => void) {
  collapsedListeners.add(cb);
  window.addEventListener('storage', cb);
  return () => { collapsedListeners.delete(cb); window.removeEventListener('storage', cb); };
}
function getCollapsedSnapshot(defaultCollapsed: boolean) {
  try {
    const stored = localStorage.getItem(COLLAPSED_KEY);
    return stored === null ? defaultCollapsed : stored === 'true';
  } catch { return defaultCollapsed; }
}
function setCollapsedStored(next: boolean) {
  try { localStorage.setItem(COLLAPSED_KEY, String(next)); } catch { }
  collapsedListeners.forEach((listener) => listener());
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const { data: publicSettings } = usePublicSettings();
  const defaultCollapsed = publicSettings?.['ui.sidebarCollapsedByDefault'] === true;
  const collapsed = useSyncExternalStore(subscribeCollapsed, () => getCollapsedSnapshot(defaultCollapsed), () => defaultCollapsed);
  const { data: admin, isLoading } = useAdminCurrentUser();
  const displayName = admin?.name || admin?.email?.split('@')[0] || 'Admin';

  const toggleSidebar = useCallback(() => {
    if (window.matchMedia('(min-width: 768px)').matches) setCollapsedStored(!collapsed);
    else setMobileOpen((open) => !open);
  }, [collapsed]);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  const handleSignOut = useCallback(async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
      queryClient.clear(); router.replace('/admin/login'); router.refresh();
    } catch (error) { notify.error(getErrorMessage(error, 'Failed to sign out')); }
  }, [router, queryClient]);

  return <div className="flex h-screen supports-[height:100dvh]:h-dvh overflow-hidden bg-base-200/50">
    {mobileOpen && <div className="fixed inset-0 z-30 bg-base-content/40 md:hidden" onClick={closeMobile} aria-hidden="true" />}
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-base-300 bg-base-100 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] transition-[transform,width] duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:static md:z-auto md:h-full md:translate-x-0 ${collapsed ? 'md:w-18' : 'md:w-64'}`}>
      <div className={`flex items-center gap-2 border-b border-base-200 p-6 ${collapsed ? 'md:justify-center md:px-0' : ''}`}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-content">A</div>
        <span className={`text-lg font-semibold tracking-tight text-base-content ${collapsed ? 'md:hidden' : ''}`}>Admin</span>
        <button type="button" onClick={closeMobile} aria-label="Close menu" className="ml-auto rounded-md p-1.5 text-base-content/60 hover:bg-base-200 md:hidden"><X className="h-5 w-5" /></button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navigation.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return <Link key={item.name} href={item.href} onClick={closeMobile} title={collapsed ? item.name : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${collapsed ? 'md:justify-center' : ''} ${active ? 'bg-primary/10 text-primary' : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'}`}>
            <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-primary' : 'text-base-content/50'}`} /><span className={collapsed ? 'md:hidden' : ''}>{item.name}</span>
          </Link>;
        })}
      </nav>
      <div className="border-t border-base-200 p-4">
        <div className={`mb-3 flex items-center gap-3 px-3 py-2 ${collapsed ? 'md:justify-center md:px-0' : ''}`}>
          {isLoading ? <><div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-base-200" /><div className={`min-w-0 flex-1 space-y-1.5 ${collapsed ? 'md:hidden' : ''}`}><div className="h-3 w-24 animate-pulse rounded bg-base-200" /><div className="h-3 w-32 animate-pulse rounded bg-base-200" /></div></> : <>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{displayName.charAt(0).toUpperCase()}</div>
            <div className={`min-w-0 flex-1 ${collapsed ? 'md:hidden' : ''}`}><p className="truncate text-sm font-medium text-base-content">{displayName}</p>{admin?.email && <p className="truncate text-xs text-base-content/60">{admin.email}</p>}</div>
          </>}
        </div>
        <button type="button" onClick={() => setSignOutOpen(true)} title={collapsed ? 'Sign out' : undefined} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-error transition-colors hover:bg-error/10 ${collapsed ? 'md:justify-center' : ''}`}>
          <LogOut className="h-4 w-4 shrink-0" /><span className={collapsed ? 'md:hidden' : ''}>Sign out</span>
        </button>
      </div>
    </aside>
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="flex min-h-16 shrink-0 items-center justify-between border-b border-base-300 bg-base-100 px-4 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))] md:px-8">
        <button type="button" onClick={toggleSidebar} aria-label="Toggle sidebar" aria-expanded={mobileOpen || !collapsed} className="rounded-md p-2 text-base-content/60 transition-colors hover:bg-base-200 hover:text-base-content">
          <Menu className="h-5 w-5 md:hidden" />{collapsed ? <ChevronsRight className="hidden h-7 w-7 rounded-lg border border-base-300 p-0.5 md:block" /> : <ChevronsLeft className="hidden h-7 w-7 rounded-lg border border-base-300 p-0.5 md:block" />}
        </button>
        <ThemeMenu />
      </header>
      <main className="min-h-0 flex-1 overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:p-8 md:pb-[calc(2rem+env(safe-area-inset-bottom))]">{children}</main>
    </div>
    <ConfirmDialog isOpen={signOutOpen} title="Sign out" description="End your admin session?" confirmText="Sign out" variant="danger" onConfirm={handleSignOut} onClose={() => setSignOutOpen(false)} />
  </div>;
}
