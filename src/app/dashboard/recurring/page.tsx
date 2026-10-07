'use client';

import { useMemo, useState } from 'react';
import { Repeat, TrendingUp, TrendingDown } from 'lucide-react';
import { LockedButton, UsageMeter, useLimit } from '@/features/plans';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { notify } from '@/lib/ui/toast';
import { usePermission } from '@/features/workspaces/hooks/use-permission';
import { formatINR } from '@/features/budgets/utils';
import { RecurringTable } from '@/features/recurring/components/RecurringTable';
import { RecurringModal } from '@/features/recurring/components/RecurringModal';
import {
    useRecurring,
    useUpdateRecurring,
    useDeleteRecurring,
} from '@/features/recurring/hooks/use-recurring';
import { monthlyEquivalent, type RecurringTransactionDTO } from '@/features/recurring/types';
import { useUserLocale } from '@/features/settings/hooks/use-settings';

export default function RecurringPage() {
    const locale = useUserLocale();
    const canManage = usePermission('recurring.manage');
    const { canCreate: withinLimit } = useLimit('maxRecurring');

    const { data, isLoading, isFetching, isError, error } = useRecurring();
    const update = useUpdateRecurring();
    const remove = useDeleteRecurring();

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<RecurringTransactionDTO | null>(null);
    const [removing, setRemoving] = useState<RecurringTransactionDTO | null>(null);

    const items = useMemo(() => data ?? [], [data]);
    const showEmpty = !isLoading && !isError && items.length === 0;

    const stats = useMemo(() => {
        const active = items.filter((r) => r.isActive);
        const sum = (type: 'CREDIT' | 'DEBIT') =>
            active.filter((r) => r.type === type).reduce((acc, r) => acc + monthlyEquivalent(r), 0);
        return { activeCount: active.length, income: sum('CREDIT'), expense: sum('DEBIT') };
    }, [items]);

    function openCreate() {
        setEditing(null);
        setFormOpen(true);
    }

    function openEdit(r: RecurringTransactionDTO) {
        setEditing(r);
        setFormOpen(true);
    }

    async function toggle(r: RecurringTransactionDTO) {
        try {
            await update.mutateAsync({ id: r.id, patch: { isActive: !r.isActive } });
            notify.success(r.isActive ? 'Schedule paused' : 'Schedule resumed');
        } catch (e) {
            notify.error(e instanceof Error ? e.message : 'Failed to update schedule');
        }
    }

    async function confirmRemove() {
        if (!removing) return;
        try {
            await remove.mutateAsync(removing.id);
            notify.success('Schedule deleted');
            setRemoving(null);
        } catch (e) {
            notify.error(e instanceof Error ? e.message : 'Failed to delete schedule');
        }
    }

    return (
        <div className="mx-auto max-w-7xl space-y-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-base-content text-2xl font-bold tracking-tight">
                        Recurring Transactions
                    </h1>
                    <p className="text-base-content/60 text-sm">
                        Manage your scheduled income and expenses.
                    </p>
                </div>
                {canManage && (
                    <div className="flex items-center gap-3">
                        <UsageMeter limitKey="maxRecurring" />
                        <LockedButton
                            data-tour="recurring-add-btn"
                            locked={!withinLimit}
                            lockedMessage="You've reached your recurring transactions limit."
                            onClick={openCreate}
                        >
                            + Add Recurring
                        </LockedButton>
                    </div>
                )}
            </div>

            {items.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="border-base-300 bg-base-100 rounded-xl border p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                                <Repeat className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-base-content text-sm font-semibold">
                                    Active schedules
                                </p>
                                <p className="text-base-content/60 text-xs">
                                    {items.length} in total
                                </p>
                            </div>
                        </div>
                        <p className="text-base-content mt-4 text-2xl font-bold tracking-tight">
                            {stats.activeCount}
                        </p>
                    </div>

                    <div className="border-base-300 bg-base-100 rounded-xl border p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="bg-success/10 text-success flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-base-content text-sm font-semibold">
                                    Monthly income
                                </p>
                                <p className="text-base-content/60 text-xs">
                                    Average, from active schedules
                                </p>
                            </div>
                        </div>
                        <p className="text-success mt-4 text-2xl font-bold tracking-tight">
                            {formatINR(stats.income, locale)}
                        </p>
                    </div>

                    <div className="border-base-300 bg-base-100 rounded-xl border p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="bg-warning/10 text-warning flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                                <TrendingDown className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-base-content text-sm font-semibold">
                                    Monthly expenses
                                </p>
                                <p className="text-base-content/60 text-xs">
                                    Average, from active schedules
                                </p>
                            </div>
                        </div>
                        <p className="text-base-content mt-4 text-2xl font-bold tracking-tight">
                            {formatINR(stats.expense, locale)}
                        </p>
                    </div>
                </div>
            )}

            {isError ? (
                <div className="border-error/30 bg-error/10 text-error rounded-lg border p-3 text-sm">
                    {error instanceof Error
                        ? error.message
                        : 'Failed to load recurring transactions'}
                </div>
            ) : showEmpty ? (
                <div className="border-base-300 bg-base-100 rounded-xl border border-dashed p-12 text-center">
                    <p className="text-base-content text-sm font-semibold">
                        No recurring transactions yet
                    </p>
                    <p className="text-base-content/60 mt-1 text-sm">
                        Add rent, salary or subscriptions once and they will be recorded
                        automatically.
                    </p>
                    {canManage && (
                        <div className="mt-4 flex justify-center">
                            <LockedButton
                                locked={!withinLimit}
                                lockedMessage="You've reached your recurring transactions limit."
                                onClick={openCreate}
                            >
                                + Add Recurring
                            </LockedButton>
                        </div>
                    )}
                </div>
            ) : (
                <div data-tour="recurring-list">
                    <RecurringTable
                        items={items}
                        canManage={canManage}
                        onEdit={openEdit}
                        onToggle={toggle}
                        onDelete={setRemoving}
                        isLoading={isLoading}
                        isFetching={isFetching}
                    />
                </div>
            )}

            {formOpen && (
                <RecurringModal
                    key={editing?.id ?? 'new'}
                    isOpen={true}
                    onClose={() => setFormOpen(false)}
                    editing={editing}
                />
            )}

            <ConfirmDialog
                isOpen={!!removing}
                title="Delete recurring transaction?"
                description={`Delete the schedule "${removing?.description || 'Untitled'}"? Transactions already created are kept.`}
                confirmText="Delete"
                variant="danger"
                onConfirm={confirmRemove}
                onClose={() => setRemoving(null)}
                loading={remove.isPending}
            />
        </div>
    );
}
