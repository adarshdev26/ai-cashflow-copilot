'use client';

import { Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { User, Building2, SlidersHorizontal } from 'lucide-react';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { ProfileTab } from './_components/ProfileTab';
import { WorkspaceTab } from './_components/WorkspaceTab';
import { PreferencesTab } from './_components/PreferencesTab';

type TabId = 'profile' | 'preferences' | 'workspace';

const TABS: readonly TabItem<TabId>[] = [
  { id: 'profile', label: 'Profile', icon: <User className="h-4 w-4" /> },
  { id: 'preferences', label: 'Preferences', icon: <SlidersHorizontal className="h-4 w-4" /> },
  { id: 'workspace', label: 'Workspace', icon: <Building2 className="h-4 w-4" /> },
];

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsTabs />
    </Suspense>
  );
}

function SettingsTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tab = searchParams.get('tab');
  const active: TabId = tab === 'workspace' || tab === 'preferences' ? tab : 'profile';

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-base-content">Settings</h1>
        <p className="mt-1 text-base-content/60">Manage your account, preferences and workspace.</p>
      </div>

      <div data-tour="settings-tabs">
        <Tabs
          tabs={TABS}
          active={active}
          onChange={(id) => router.replace(`${pathname}?tab=${id}`, { scroll: false })}
        />
      </div>

      {active === 'profile' ? <ProfileTab /> : active === 'preferences' ? <PreferencesTab /> : <WorkspaceTab />}
    </div>
  );
}
