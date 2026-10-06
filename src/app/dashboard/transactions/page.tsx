'use client';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useActiveAccountId } from '@/features/accounts';
import { OnChangeFn, PaginationState, SortingState } from '@tanstack/react-table';
import {
    useTransactions,
    useCreateTransaction,
    useUpdateTransaction,
    useDeleteTransaction,
    FinanceHeader,
    TransactionTable,
    FinanceStats,
} from '@/features/finance';
import {
    templateToInitialValues,
    type TransactionTemplateDTO,
} from '@/features/transaction-templates';
import { useListQueryState } from '@/hooks/list/useListQueryState';
import { useCategories } from '@/resources/hooks/use-categories';
import {
    CreateTransactionInput,
    Transaction,
    TransactionFilters,
    TransactionSortField,
    TransactionType,
    UpdateTransactionInput,
} from '@/features/finance/types';
import { CategoryStatsTooltip } from '@/resources/components/CategoryStats';
import { useActiveWorkspaceId, usePermission } from '@/features/workspaces';
import { notify, getErrorMessage } from '@/lib/ui/toast';
import { useAccounts } from '@/features/accounts';
import { TransactionFilters as TransactionFiltersBar } from '@/features/finance/components/TransactionFilters';
import {
    TransactionDialogs,
    type TransactionFormState,
} from '@/features/finance/components/TransactionDialogs';
import { useUserPreferences, usePublicSettings } from '@/features/settings/hooks/use-settings';
import { SETTINGS_BY_KEY } from '@/lib/settings/registry';

const defaultTransactionFilters: TransactionFilters = {
    search: undefined,
    type: undefined,
    categoryId: undefined,
    accountId: undefined,
    dateFrom: undefined,
    dateTo: undefined,
};

export default function TransactionsPage() {
    const { data: preferences, isPlaceholderData: preferencesLoading } = useUserPreferences();
    const { data: publicSettings } = usePublicSettings();
    const preferredPageSize = Number(
        preferences?.tablePageSize ?? SETTINGS_BY_KEY.tablePageSize.default,
    );
    const tableDensity = preferences?.tableDensity === 'compact' ? 'compact' : 'comfortable';
    const maxPageSize = Number(
        publicSettings?.['limits.listMaxPageSize'] ??
            SETTINGS_BY_KEY['limits.listMaxPageSize'].default,
    );
    const {
        params,
        page,
        pageSize,
        setPage,
        setPageSize,
        sortBy,
        sortDir,
        setSort,
        filters,
        setFilter,
    } = useListQueryState<TransactionFilters, TransactionSortField>({
        defaultFilters: defaultTransactionFilters,
        defaultSortDir: 'desc',
        defaultPageSize: preferredPageSize,
        maxPageSize,
    });
    useEffect(() => {
        if (!preferencesLoading) setPageSize(preferredPageSize);
    }, [preferencesLoading, preferredPageSize, setPageSize]);
    const isInvalidDateRange = Boolean(
        filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo,
    );
    const workspaceId = useActiveWorkspaceId();
    const canCreate = usePermission('transaction.create');
    const canUpdate = usePermission('transaction.update');
    const canDelete = usePermission('transaction.delete');
    const { data: categories, isLoading: categoriesLoading } = useCategories();
    const { data: accounts, isLoading: accountsLoading } = useAccounts(workspaceId);

    const [activeAccountId] = useActiveAccountId();
    const queryParams = useMemo(
        () => ({ ...params, accountId: activeAccountId ?? undefined }),
        [params, activeAccountId],
    );

    // Back to page 1 when the account changes.
    const prevAccountRef = useRef(activeAccountId);
    useEffect(() => {
        if (prevAccountRef.current !== activeAccountId) {
            prevAccountRef.current = activeAccountId;
            setPage(1);
        }
    }, [activeAccountId, setPage]);

    const {
        data: transactionResponse,
        isLoading,
        error,
        isFetching,
    } = useTransactions(workspaceId, queryParams, { enabled: !isInvalidDateRange });
    const { mutate: addTx, isPending: isAdding } = useCreateTransaction(workspaceId);
    const { mutate: updateTx, isPending: isUpdating } = useUpdateTransaction(workspaceId);
    const { mutate: deleteTx, isPending: isDeleting } = useDeleteTransaction(workspaceId);

    const [formState, setFormState] = useState<TransactionFormState>(null);
    const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
    const [exportOpen, setExportOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);

    const isSubmitting = isAdding || isUpdating;

    const handleCreateTransaction = useCallback(
        (data: CreateTransactionInput) => {
            addTx(data, {
                onSuccess: () => {
                    setFormState(null);
                    notify.success('Transaction created');
                },
                onError: (error) => {
                    console.error('Failed to create transaction:', error);
                    notify.error(getErrorMessage(error, 'Failed to create transaction'));
                },
            });
        },
        [addTx],
    );

    const handleUpdateTransaction = useCallback(
        (data: UpdateTransactionInput) => {
            if (formState?.mode !== 'edit') return;
            updateTx(
                { id: formState.transaction.id, data },
                {
                    onSuccess: () => {
                        setFormState(null);
                        notify.success('Transaction updated');
                    },
                    onError: (error) => {
                        console.error('Failed to update transaction:', error);
                        notify.error(getErrorMessage(error, 'Failed to update transaction'));
                    },
                },
            );
        },
        [formState, updateTx],
    );

    const handleDeleteTransaction = useCallback(() => {
        if (!deleteTarget) return;
        deleteTx(deleteTarget.id, {
            onSuccess: () => {
                setDeleteTarget(null);
                notify.success('Transaction deleted');
            },
            onError: (error) => {
                console.error('Failed to delete transaction:', error);
                notify.error(getErrorMessage(error, 'Failed to delete transaction'));
            },
        });
    }, [deleteTarget, deleteTx]);

    const openCreateModal = useCallback(() => setFormState({ mode: 'create' }), []);
    const openCreateFromTemplate = useCallback(
        (t: TransactionTemplateDTO) =>
            setFormState({
                mode: 'create',
                initialValues: templateToInitialValues(t),
                templateId: t.id,
            }),
        [],
    );
    const closeModal = useCallback(() => setFormState(null), []);
    const openEditModal = useCallback(
        (tx: Transaction) => setFormState({ mode: 'edit', transaction: tx }),
        [],
    );
    const openDeleteTarget = useCallback((tx: Transaction) => setDeleteTarget(tx), []);
    const closeDeleteTarget = useCallback(() => setDeleteTarget(null), []);

    const pagination: PaginationState = useMemo(
        () => ({ pageIndex: page - 1, pageSize }),
        [page, pageSize],
    );
    const sorting: SortingState = useMemo(
        () => (sortBy ? [{ id: sortBy, desc: sortDir === 'desc' }] : []),
        [sortBy, sortDir],
    );
    const globalFilter = filters.search ?? '';

    const handleSortingChange: OnChangeFn<SortingState> = useCallback(
        (updater) => {
            const currentSorting: SortingState = sortBy
                ? [{ id: sortBy, desc: sortDir === 'desc' }]
                : [];
            const nextSorting = typeof updater === 'function' ? updater(currentSorting) : updater;
            const nextSort = nextSorting[0];
            setSort(
                nextSort?.id as TransactionSortField | undefined,
                nextSort?.desc ? 'desc' : 'asc',
            );
        },
        [setSort, sortBy, sortDir],
    );

    const handleGlobalFilterChange: OnChangeFn<string> = useCallback(
        (updater) => {
            const nextSearch = typeof updater === 'function' ? updater(globalFilter) : updater;
            setFilter('search', nextSearch || undefined);
        },
        [globalFilter, setFilter],
    );

    const handleTypeChange = useCallback(
        (value: TransactionType | '') => {
            setFilter('type', value || undefined);
        },
        [setFilter],
    );

    const handleCategoryChange = useCallback(
        (value: string) => {
            setFilter('categoryId', value || undefined);
        },
        [setFilter],
    );

    const handleAccountChange = useCallback(
        (value: string) => {
            setFilter('accountId', value || undefined);
        },
        [setFilter],
    );

    const handleDateFromChange = useCallback(
        (value: string) => {
            setFilter('dateFrom', value || undefined);
        },
        [setFilter],
    );

    const handleDateToChange = useCallback(
        (value: string) => {
            setFilter('dateTo', value || undefined);
        },
        [setFilter],
    );

    const handlePaginationChange: OnChangeFn<PaginationState> = useCallback(
        (updater) => {
            const currentPagination: PaginationState = { pageIndex: page - 1, pageSize };
            const nextPagination =
                typeof updater === 'function' ? updater(currentPagination) : updater;
            if (nextPagination.pageSize !== pageSize) {
                setPageSize(nextPagination.pageSize);
            } else {
                setPage(nextPagination.pageIndex + 1);
            }
        },
        [page, pageSize, setPage, setPageSize],
    );

    // if (isLoading) return <div className="text-sm text-base-content/60 animate-pulse p-8">Loading finance ledger...</div>;
    if (error) return <div className="text-error p-8 text-sm">Failed to load transactions.</div>;

    return (
        <div className="mx-auto max-w-7xl space-y-8">
            <FinanceHeader
                onOpenModal={openCreateModal}
                onUseTemplate={openCreateFromTemplate}
                onOpenExport={() => setExportOpen(true)}
                onOpenImport={() => setImportOpen(true)}
            />
            <FinanceStats netBalance={false} thisMonthNet={false} lastMonthNet={false} />

            <CategoryStatsTooltip />

            <TransactionFiltersBar
                filters={filters}
                categories={categories}
                accounts={accounts}
                categoriesLoading={categoriesLoading}
                accountsLoading={accountsLoading}
                isInvalidDateRange={isInvalidDateRange}
                onTypeChange={handleTypeChange}
                onAccountChange={handleAccountChange}
                onCategoryChange={handleCategoryChange}
                onDateFromChange={handleDateFromChange}
                onDateToChange={handleDateToChange}
            />

            <TransactionTable
                transactions={transactionResponse?.data}
                density={tableDensity}
                pagination={pagination}
                sorting={sorting}
                globalFilter={globalFilter}
                pageCount={transactionResponse?.pagination.totalPages ?? 1}
                totalCount={transactionResponse?.pagination.totalCount ?? 0}
                onPaginationChange={handlePaginationChange}
                onSortingChange={handleSortingChange}
                onGlobalFilterChange={handleGlobalFilterChange}
                onEdit={openEditModal}
                onDelete={openDeleteTarget}
                isLoading={isLoading}
                isFetching={isFetching}
            />

            <TransactionDialogs
                formState={formState}
                deleteTarget={deleteTarget}
                exportOpen={exportOpen}
                importOpen={importOpen}
                workspaceId={workspaceId}
                activeAccountId={activeAccountId ?? null}
                activeAccountName={accounts?.find((a) => a.id === activeAccountId)?.name}
                filters={filters}
                canCreate={canCreate}
                canUpdate={canUpdate}
                canDelete={canDelete}
                isSubmitting={isSubmitting}
                isDeleting={isDeleting}
                onCloseForm={closeModal}
                onCreate={handleCreateTransaction}
                onUpdate={handleUpdateTransaction}
                onDelete={handleDeleteTransaction}
                onCloseDelete={closeDeleteTarget}
                onCloseExport={() => setExportOpen(false)}
                onCloseImport={() => setImportOpen(false)}
            />
        </div>
    );
}
