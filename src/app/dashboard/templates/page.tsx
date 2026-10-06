'use client';

import { useMemo, useState } from 'react';
import { LockedButton, UsageMeter, useLimit } from '@/features/plans';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { notify } from '@/lib/ui/toast';
import { usePermission } from '@/features/workspaces/hooks/use-permission';
import {
    useTransactionTemplates,
    useDeleteTemplate,
    type TransactionTemplateDTO,
} from '@/features/transaction-templates';
import { TransactionTemplateTable } from '@/features/transaction-templates/components/TransactionTemplateTable';
import { TransactionTemplateModal } from '@/features/transaction-templates/components/TransactionTemplateModal';

export default function TemplatesPage() {
  const canManage = usePermission('templates.manage');
    const { canCreate: withinLimit } = useLimit('maxTemplates');

    const { data, isLoading, isFetching, isError, error } = useTransactionTemplates();
    const remove = useDeleteTemplate();

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<TransactionTemplateDTO | null>(null);
    const [removing, setRemoving] = useState<TransactionTemplateDTO | null>(null);

    const items = useMemo(() => data ?? [], [data]);
    const showEmpty = !isLoading && !isError && items.length === 0;

    function openCreate() {
        setEditing(null);
        setFormOpen(true);
    }

    function openEdit(t: TransactionTemplateDTO) {
        setEditing(t);
        setFormOpen(true);
    }

    async function confirmRemove() {
        if (!removing) return;
        try {
            await remove.mutateAsync(removing.id);
            notify.success('Template deleted');
            setRemoving(null);
        } catch (e) {
            notify.error(e instanceof Error ? e.message : 'Failed to delete template');
        }
    }

    return (
        <div className="mx-auto max-w-7xl space-y-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-base-content text-2xl font-bold tracking-tight">
                        Templates
                    </h1>
                    <p className="text-base-content/60 text-sm">
                        Reusable transactions you can apply in a couple of clicks.
                    </p>
                </div>
            {canManage && (
                    <div className="flex items-center gap-3">
                        <UsageMeter limitKey="maxTemplates" />
                        <LockedButton
                            data-tour="templates-add-btn"
                            locked={!withinLimit}
                            lockedMessage="You've reached your template limit."
                            onClick={openCreate}
                        >
                            + Add Template
                        </LockedButton>
                    </div>
                )}
            </div>

            {isError ? (
                <div className="border-error/30 bg-error/10 text-error rounded-lg border p-3 text-sm">
                    {error instanceof Error ? error.message : 'Failed to load templates'}
                </div>
            ) : showEmpty ? (
                <div className="border-base-300 bg-base-100 rounded-xl border border-dashed p-12 text-center">
                    <p className="text-base-content text-sm font-semibold">No templates yet</p>
                    <p className="text-base-content/60 mt-1 text-sm">
                        Save things you enter often, like coffee, rent or fuel, and reuse them from
                        the Transactions page.
                    </p>
                    {canManage && (
                        <div className="mt-4 flex justify-center">
                     <LockedButton
                                locked={!withinLimit}
                                lockedMessage="You've reached your template limit."
                                onClick={openCreate}
                            >
                                + Add Template
                            </LockedButton>
                        </div>
                    )}
                </div>
            ) : (
                <div data-tour="templates-list">
                    <TransactionTemplateTable
                        items={items}
                        canManage={canManage}
                        onEdit={openEdit}
                        onDelete={setRemoving}
                        isLoading={isLoading}
                        isFetching={isFetching}
                    />
                </div>
            )}

            {formOpen && (
                <TransactionTemplateModal
                    key={editing?.id ?? 'new'}
                    isOpen={true}
                    onClose={() => setFormOpen(false)}
                    editing={editing}
                />
            )}

            <ConfirmDialog
                isOpen={!!removing}
                title="Delete template?"
                description={`Delete the template "${removing?.name ?? ''}"? Transactions already created from it are kept.`}
                confirmText="Delete"
                variant="danger"
                onConfirm={confirmRemove}
                onClose={() => setRemoving(null)}
                loading={remove.isPending}
            />
        </div>
    );
}
