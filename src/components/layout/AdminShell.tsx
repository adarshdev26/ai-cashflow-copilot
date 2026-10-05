'use client';

import Link from 'next/link';
import { useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Users, Building2, LogOut, Menu, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ThemeMenu } from '@/components/ui/ThemePicker';
import { notify, getErrorMessage } from '@/lib/toast';
import { useAdminCurrentUser } from '@/features/admin/hooks/use-admin-current-user';

const navigation = [
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Workspaces', href: '/admin/workspaces', icon: Building2 },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const { data: admin, isLoading } = useAdminCurrentUser();

  const displayName = admin?.name || admin?.email?.split('@')[0] || 'Admin';

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
    <div className="h-screen overflow-hidden bg-base-200/50 flex">
      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 flex flex-col border-r border-base-300 bg-base-100 transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } md:static md:z-auto md:translate-x-0 md:h-full`}
      >
        <div className="p-6 border-b border-base-200 flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-content font-bold text-lg">A</div>
          <span className="font-semibold text-lg tracking-tight text-base-content">Admin</span>
          <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close menu" className="ml-auto rounded-md p-1.5 text-base-content/60 hover:bg-base-200 md:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'bg-primary/10 text-primary' : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-primary' : 'text-base-content/50'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-base-200">
          <div className="mb-3 flex items-center gap-3 px-3 py-2">
            {isLoading ? (
              <div className="h-9 w-full rounded bg-base-200 animate-pulse" />
            ) : (
              <>
                <div className="h-9 w-9 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-base-content">{displayName}</p>
                  {admin?.email && <p className="truncate text-xs text-base-content/60">{admin.email}</p>}
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => setSignOutOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-error hover:bg-error/10 transition-colors"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <header className="h-16 shrink-0 border-b border-base-300 bg-base-100 px-4 md:px-8 flex items-center justify-between">
          <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open menu" className="rounded-md p-2 text-base-content/60 hover:bg-base-200 md:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-auto"><ThemeMenu /></div>
        </header>
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>

      <ConfirmDialog
        isOpen={signOutOpen}
        title="Sign Out"
        description="End your admin session?"
        confirmText="Sign Out"
        variant="danger"
        onConfirm={handleSignOut}
        onClose={() => setSignOutOpen(false)}
      />
    </div>
  );
}