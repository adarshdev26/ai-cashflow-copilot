'use client';

import { useCallback, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FilterSelect } from '@/components/ui/FilterSelect';
import { notify, getErrorMessage } from '@/lib/ui/toast';
import type { CategoryKind } from '@/features/categories/types';
import { useAdminTableState } from '../../shared/hooks/use-admin-table-state';
import { useAdminCategoryMutations, useAdminCategories } from '../hooks/use-admin-categories';
import type { AdminCategoryFilters, AdminCategoryRow, AdminCategorySortField } from '../types';
import { CategoriesTable } from './CategoriesTable';
import { CategoryFormModal } from './modals/CategoryFormModal';

type Dialog =
    | { kind: 'form'; category: AdminCategoryRow | null }
    | { kind: 'confirm'; action: 'deactivate' | 'delete'; category: AdminCategoryRow };

export function AdminCategoriesPage() {
    const table = useAdminTableState<AdminCategoryFilters, AdminCategorySortField>({
        defaultFilters: { search: undefined, isActive: undefined, type: undefined },
        defaultSortBy: 'name',
        defaultSortDir: 'asc',
    });
    const { data, isLoading, isFetching, isError, error, refetch } = useAdminCategories(
        table.list.params,
    );
    const mutations = useAdminCategoryMutations();
    const [dialog, setDialog] = useState<Dialog | null>(null);
    const [confirmError, setConfirmError] = useState<string>();

    const edit = useCallback(
        (category: AdminCategoryRow) => setDialog({ kind: 'form', category }),
        [],
    );
    const toggleStatus = useCallback(
        async (category: AdminCategoryRow) => {
            if (category.isActive) {
                setConfirmError(undefined);
                setDialog({ kind: 'confirm', action: 'deactivate', category });
                return;
            }
            try {
                await mutations.update.mutateAsync({ id: category.id, data: { isActive: true } });
                notify.success('Category activated');
            } catch (cause) {
                notify.error(getErrorMessage(cause, 'Failed to activate category'));
            }
        },
        [mutations.update],
    );
    const confirm = useCallback(async () => {
        if (dialog?.kind !== 'confirm') return;
        setConfirmError(undefined);
        try {
            if (dialog.action === 'delete') await mutations.remove.mutateAsync(dialog.category.id);
            else
                await mutations.update.mutateAsync({
                    id: dialog.category.id,
                    data: { isActive: false },
                });
            notify.success(
                dialog.action === 'delete' ? 'Category deleted' : 'Category deactivated',
            );
            setDialog(null);
        } catch (cause) {
            setConfirmError(getErrorMessage(cause, 'Action failed'));
        }
    }, [dialog, mutations.remove, mutations.update]);

    const filtersActive = Boolean(
        table.globalFilter || table.list.filters.isActive || table.list.filters.type,
    );
    const empty = !isLoading && !isError && data?.pagination.totalCount === 0 && !filtersActive;
    const pending = mutations.remove.isPending || mutations.update.isPending;
    const closeDialog = useCallback(() => {
        if (!pending) setDialog(null);
    }, [pending]);

    return (
        <div className="mx-auto max-w-7xl space-y-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-base-content text-2xl font-bold tracking-tight">
                        Global categories
                    </h1>
                    <p className="text-base-content/60 text-sm">
                        Manage categories shared across all workspaces.
                    </p>
                    {data && (
                        <p className="text-base-content/50 mt-1 text-xs">
                            {data.customCategoryCount} custom workspace categories are not managed
                            here.
                        </p>
                    )}
                </div>
                <Button
                    leftIcon={<Plus className="h-4 w-4" />}
                    onClick={() => setDialog({ kind: 'form', category: null })}
                >
                    Add category
                </Button>
            </div>

            {isError && !data ? (
                <div className="border-error/30 bg-error/10 rounded-xl border p-6 text-center">
                    <p className="text-error text-sm">
                        {getErrorMessage(error, 'Failed to load categories.')}
                    </p>
                    <Button variant="secondary" className="mt-3" onClick={() => void refetch()}>
                        Try again
                    </Button>
                </div>
            ) : empty ? (
                <div className="border-base-300 bg-base-100 rounded-xl border border-dashed p-10 text-center">
                    <p className="text-base-content text-sm font-medium">
                        No global categories yet.
                    </p>
                    <p className="text-base-content/60 mt-1 text-sm">
                        Add a category to make it available in every workspace.
                    </p>
                </div>
            ) : (
                <CategoriesTable
                    data={data?.data ?? []}
                    onEdit={edit}
                    onToggleStatus={toggleStatus}
                    onDelete={(category) => {
                        setConfirmError(undefined);
                        setDialog({ kind: 'confirm', action: 'delete', category });
                    }}
                    pagination={table.paginationState}
                    sorting={table.sortingState}
                    globalFilter={table.globalFilter}
                    onPaginationChange={table.onPaginationChange}
                    onSortingChange={table.onSortingChange}
                    onGlobalFilterChange={table.onGlobalFilterChange}
                    pageCount={data?.pagination.totalPages ?? 1}
                    totalCount={data?.pagination.totalCount ?? 0}
                    isLoading={isLoading}
                    isFetching={isFetching}
                    filters={
                        <>
                            <FilterSelect
                                aria-label="Filter categories by status"
                                value={table.list.filters.isActive ?? ''}
                                onChange={(e) =>
                                    table.list.setFilter(
                                        'isActive',
                                        (e.target.value || undefined) as AdminCategoryFilters['isActive'],
                                    )
                                }
                            >
                                <option value="">All statuses</option>
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </FilterSelect>
                            <FilterSelect
                                aria-label="Filter categories by type"
                                value={table.list.filters.type ?? ''}
                                onChange={(e) =>
                                    table.list.setFilter(
                                        'type',
                                        (e.target.value || undefined) as CategoryKind | undefined,
                                    )
                                }
                            >
                                <option value="">All types</option>
                                <option value="BOTH">Income and expenses</option>
                                <option value="CREDIT">Income</option>
                                <option value="DEBIT">Expense</option>
                            </FilterSelect>
                        </>
                    }
                    activeFilterCount={
                        [table.list.filters.isActive, table.list.filters.type].filter(Boolean).length
                    }
                    onClearFilters={() =>
                        table.list.setFilters({ isActive: undefined, type: undefined })
                    }
                />
            )}

            {dialog?.kind === 'form' && (
                <CategoryFormModal
                    key={dialog.category?.id ?? 'new-global-category'}
                    category={dialog.category}
                    onClose={() => setDialog(null)}
                />
            )}
            {dialog?.kind === 'confirm' && (
                <ConfirmDialog
                    isOpen
                    title={
                        dialog.action === 'delete'
                            ? 'Delete global category'
                            : 'Deactivate global category'
                    }
                    description={
                        dialog.action === 'delete'
                            ? `Delete "${dialog.category.name}"? ${dialog.category.usage.transactions} transactions will become uncategorized and ${dialog.category.usage.transactionTemplates} templates will lose this category. Categories used by budgets or recurring schedules cannot be deleted.`
                            : `"${dialog.category.name}" will no longer be offered for new transactions. Existing references remain intact.`
                    }
                    confirmText={dialog.action === 'delete' ? 'Delete' : 'Deactivate'}
                    variant="danger"
                    loading={pending}
                    error={confirmError}
                    onConfirm={confirm}
                    onClose={closeDialog}
                />
            )}
        </div>
    );
}
