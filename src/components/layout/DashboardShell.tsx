'use client';

import Link from 'next/link';
import { useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, WalletCards, CheckSquare, FileText, Settings, LogOut } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useCurrentUser } from '@/features/auth';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Finance', href: '/dashboard/finance', icon: WalletCards },
  { name: 'Habits', href: '/dashboard/habits', icon: CheckSquare },
  { name: 'Notes', href: '/dashboard/notes', icon: FileText },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSignOutOpen, setIsSignOutOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: user, isLoading: isUserLoading } = useCurrentUser();

  const displayName = user?.name || user?.email?.split('@')[0] || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  const handleSignOut = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      queryClient.clear();
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  }, [router, queryClient]);

  const openSignOutDialog = useCallback(() => setIsSignOutOpen(true), []);
  const closeSignOutDialog = useCallback(() => setIsSignOutOpen(false), []);

  return (
    <div className="min-h-screen bg-slate-50/50 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-100 flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
            A
          </div>
          <span className="font-semibold text-lg tracking-tight text-slate-900">CashFlow Copilot</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="mb-3 flex items-center gap-3 px-3 py-2">
            {isUserLoading ? (
              <>
                <div className="h-9 w-9 shrink-0 rounded-full bg-slate-100 animate-pulse" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="h-3 w-24 rounded bg-slate-100 animate-pulse" />
                  <div className="h-3 w-32 rounded bg-slate-100 animate-pulse" />
                </div>
              </>
            ) : (
              <>
                <div className="h-9 w-9 shrink-0 rounded-full bg-indigo-50 flex items-center justify-center text-sm font-semibold text-indigo-600">
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{displayName}</p>
                  {user?.email && <p className="truncate text-xs text-slate-500">{user.email}</p>}
                </div>
              </>
            )}
          </div>
          <button
            onClick={openSignOutDialog}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 tracking-wide uppercase">Workspace Overview</h2>
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