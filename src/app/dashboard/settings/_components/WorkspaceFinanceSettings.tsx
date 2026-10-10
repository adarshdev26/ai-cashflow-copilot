'use client';

import { SettingsForm } from '@/components/settings/SettingsForm';
import { defsFor } from '@/lib/settings/registry';
import {
    useUpdateWorkspaceSettings,
    useWorkspaceSettings,
} from '@/features/settings/hooks/use-settings';
import { notify, getErrorMessage } from '@/lib/ui/toast';

const card = 'bg-base-100 rounded-xl shadow-sm border border-base-300 p-4 sm:p-6 space-y-4';
const workspaceDefs = defsFor('workspace');
const financeDefs = workspaceDefs.filter((def) => def.group === 'finance');
const featureDefs = workspaceDefs.filter((def) => def.group === 'features');

/** Render inside WorkspaceTab. canEdit = role is OWNER or ADMIN. */
export function WorkspaceFinanceSettings({
    workspaceId,
    canEdit,
}: {
    workspaceId: string;
    canEdit: boolean;
}) {
    const { data, isPlaceholderData } = useWorkspaceSettings(workspaceId);
    const update = useUpdateWorkspaceSettings(workspaceId);

    return (
        <section className={card}>
            <div>
                <h2 className="text-base-content text-lg font-semibold">Finance settings</h2>
                <p className="text-base-content/60 text-sm">
                    Shared by everyone in this workspace.
                    {!canEdit && ' Only owners and admins can change them.'}
                </p>
            </div>
            {isPlaceholderData || !data ? (
                <div className="bg-base-200 h-16 animate-pulse rounded-md" />
            ) : (
                <>
                    <SettingsForm
                        key={`${workspaceId}:finance:${JSON.stringify(data)}`}
                        defs={financeDefs}
                        values={data}
                        readOnly={!canEdit}
                        saving={update.isPending}
                        onSave={(patch) =>
                            update.mutate(patch, {
                                onSuccess: () => notify.success('Finance settings saved'),
                                onError: (err) =>
                                    notify.error(getErrorMessage(err, 'Failed to save settings')),
                            })
                        }
                    />
                    <div className="border-base-300 border-t pt-4">
                        <h3 className="text-base-content text-sm font-semibold">Features</h3>
                        <p className="text-base-content/60 mb-3 text-sm">
                            Turn workspace features on or off for everyone here.
                        </p>
                        <SettingsForm
                            key={`${workspaceId}:features:${JSON.stringify(data)}`}
                            defs={featureDefs}
                            values={data}
                            readOnly={!canEdit}
                            saving={update.isPending}
                            onSave={(patch) =>
                                update.mutate(patch, {
                                    onSuccess: () => notify.success('Feature settings saved'),
                                    onError: (err) =>
                                        notify.error(
                                            getErrorMessage(err, 'Failed to save settings'),
                                        ),
                                })
                            }
                        />
                    </div>
                </>
            )}
        </section>
    );
}
