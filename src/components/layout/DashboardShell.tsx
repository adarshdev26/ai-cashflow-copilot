'use client';

import Link from 'next/link';
import { useState} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, WalletCards, CheckSquare, FileText, Settings, LogOut } from 'lucide-react';
import {ConfirmDialog} from '@/components/ui/ConfirmDialog'

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

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
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
          <button
        onClick={() => setIsSignOutOpen(true)}
           className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 tracking-wide uppercase">Workspace Overview</h2>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center font-medium text-slate-600 text-sm">
              U
            </div>
          </div>
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
        onClose={() => setIsSignOutOpen(false)}
      />
    </div>
  );
}