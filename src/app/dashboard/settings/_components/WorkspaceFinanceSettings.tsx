'use client';

import { SettingsForm } from '@/components/settings/SettingsForm';
import { defsFor } from '@/lib/settings/registry';
import {
    useUpdateWorkspaceSettings,
    useWorkspaceSettings,
} from '@/features/settings/hooks/use-settings';
import { notify, getErrorMessage } from '@/lib/ui/toast';

const card = 'bg-base-100 rounded-xl shadow-sm border border-base-300 p-4 sm:p-6 space-y-4';
const defs = defsFor('workspace');

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
                <SettingsForm
                    key={`${workspaceId}:${JSON.stringify(data)}`}
                    defs={defs}
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
            )}
        </section>
    );
}
