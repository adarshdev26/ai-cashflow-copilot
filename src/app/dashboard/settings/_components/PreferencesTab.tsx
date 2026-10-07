'use client';

import { SettingsForm } from '@/components/settings/SettingsForm';
import { defsFor } from '@/lib/settings/registry';
import {
    useResetUserPreferences,
    useUpdateUserPreferences,
    useUserPreferences,
} from '@/features/settings/hooks/use-settings';
import { notify, getErrorMessage } from '@/lib/ui/toast';
import { useTheme } from 'next-themes';

const card = 'bg-base-100 rounded-xl shadow-sm border border-base-300 p-4 sm:p-6 space-y-4';
const defs = defsFor('user');

export function PreferencesTab() {
    const { setTheme } = useTheme();
    const { data, isPlaceholderData } = useUserPreferences();
    const update = useUpdateUserPreferences();
    const reset = useResetUserPreferences();

    return (
        <div className="space-y-6" data-tour="settings-preferences">
            <section className={card}>
                <div>
                    <h2 className="text-base-content text-lg font-semibold">Preferences</h2>
                    <p className="text-base-content/60 text-sm">
                        Only you see these. They follow you across workspaces.
                    </p>
                </div>
                {isPlaceholderData || !data ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="bg-base-200 h-16 animate-pulse rounded-md" />
                        <div className="bg-base-200 h-16 animate-pulse rounded-md" />
                    </div>
                ) : (
                    <SettingsForm
                        key={JSON.stringify(data)}
                        defs={defs}
                        values={data}
                        saving={update.isPending || reset.isPending}
                        onSave={(patch) =>
                            update.mutate(patch, {
                                onSuccess: () => {
                                    if ('theme' in patch)
                                        setTheme(
                                            typeof patch.theme === 'string'
                                                ? patch.theme
                                                : 'system',
                                        );
                                    notify.success('Preferences saved');
                                },
                                onError: (err) =>
                                    notify.error(
                                        getErrorMessage(err, 'Failed to save preferences'),
                                    ),
                            })
                        }
                        onResetAll={() =>
                            reset.mutate(undefined, {
                                onSuccess: () => {
                                    setTheme('system');
                                    notify.success('Preferences reset');
                                },
                                onError: (err) =>
                                    notify.error(
                                        getErrorMessage(err, 'Failed to reset preferences'),
                                    ),
                            })
                        }
                    />
                )}
            </section>
        </div>
    );
}
