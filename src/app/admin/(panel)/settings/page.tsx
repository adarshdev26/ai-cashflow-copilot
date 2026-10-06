'use client';

import { useState } from 'react';
import {
    Settings,
    ShieldCheck,
    Gauge,
    ToggleRight,
    SlidersHorizontal,
    Crown,
} from 'lucide-react';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { SettingsForm } from '@/components/settings/SettingsForm';
import { SETTINGS, SETTING_GROUPS } from '@/lib/settings/registry';
import { useAdminSettings, useUpdateAdminSettings } from '@/features/settings/hooks/use-settings';
import { notify, getErrorMessage } from '@/lib/ui/toast';

type GroupId = keyof typeof SETTING_GROUPS;

const TABS: readonly TabItem<GroupId>[] = [
    { id: 'general', label: SETTING_GROUPS.general, icon: <Settings className="h-4 w-4" /> },
    { id: 'auth', label: SETTING_GROUPS.auth, icon: <ShieldCheck className="h-4 w-4" /> },
    { id: 'limits', label: SETTING_GROUPS.limits, icon: <Gauge className="h-4 w-4" /> },
    { id: 'features', label: SETTING_GROUPS.features, icon: <ToggleRight className="h-4 w-4" /> },
       {
        id: 'defaults',
        label: SETTING_GROUPS.defaults,
        icon: <SlidersHorizontal className="h-4 w-4" />,
    },
    { id: 'plans', label: SETTING_GROUPS.plans, icon: <Crown className="h-4 w-4" /> },
];

const card = 'bg-base-100 rounded-xl shadow-sm border border-base-300 p-4 sm:p-6 space-y-4';

export default function AdminSettingsPage() {
    const [active, setActive] = useState<GroupId>('general');
    const { data, isLoading, isError, refetch } = useAdminSettings();
    const { mutate, isPending } = useUpdateAdminSettings();
    const defs = SETTINGS.filter((d) => d.scope === 'system' && d.group === active);

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <div>
                <h1 className="text-base-content text-2xl font-bold">System settings</h1>
                <p className="text-base-content/60 mt-1">
                    Changes apply to every workspace. Session lengths affect new sign-ins only.
                </p>
            </div>

            <Tabs tabs={TABS} active={active} onChange={setActive} />

            <section className={card}>
                <h2 className="text-base-content text-lg font-semibold">
                    {SETTING_GROUPS[active]}
                </h2>
                {isLoading ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="bg-base-200 h-16 animate-pulse rounded-md" />
                        <div className="bg-base-200 h-16 animate-pulse rounded-md" />
                    </div>
                ) : isError || !data ? (
                    <div className="space-y-3">
                        <p className="text-error text-sm">Couldn&apos;t load settings.</p>
                        <button
                            type="button"
                            onClick={() => refetch()}
                            className="btn btn-sm min-h-11 sm:min-h-0"
                        >
                            Try again
                        </button>
                    </div>
                ) : (
                    <SettingsForm
                        key={`${active}:${JSON.stringify(data)}`}
                        defs={defs}
                        values={data}
                        saving={isPending}
                        onSave={(patch) =>
                            mutate(patch, {
                                onSuccess: () => notify.success('Settings saved'),
                                onError: (err) =>
                                    notify.error(getErrorMessage(err, 'Failed to save settings')),
                            })
                        }
                    />
                )}
            </section>
        </div>
    );
}
