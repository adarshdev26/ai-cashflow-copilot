'use client';
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useActiveAccountId } from '@/features/accounts';
import { OnChangeFn, PaginationState, SortingState } from '@tanstack/react-table';
import {
  useTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  FinanceHeader,
  TransactionTable,
  TransactionModal,
  FinanceStats,
  type TransactionInitialValues,
} from '@/features/finance';
import {
  templateToInitialValues,
  type TransactionTemplateDTO
} from '@/features/transaction-templates';
import { useListQueryState } from '@/hooks/list/useListQueryState';
import { useCategories } from '@/resources/hooks/use-categories';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  CreateTransactionInput,
  Transaction,
  TransactionFilters,
  TransactionSortField,
  TransactionType,
  UpdateTransactionInput,
} from '@/features/finance/types';
import { CategoryStatsTooltip } from "@/resources/components/CategoryStats";
import { useActiveWorkspaceId, usePermission } from '@/features/workspaces';
import { notify, getErrorMessage } from '@/lib/toast';
import { useAccounts } from '@/features/accounts';
import { ExportTransactionsModal } from "@/features/finance";
import { ImportTransactionsModal } from "@/features/finance";

type FormState =
  | { mode: 'create'; initialValues?: TransactionInitialValues; templateId?: string }
  | { mode: 'edit'; transaction: Transaction }
  | null;

const defaultTransactionFilters: TransactionFilters = {
  search: undefined,
  type: undefined,
  categoryId: undefined,
  accountId: undefined,
  dateFrom: undefined,
  dateTo: undefined,
};

export default function TransactionsPage() {
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
    defaultPageSize: 10,
    maxPageSize: 100,
  });
  const isInvalidDateRange = Boolean(filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo);
  const workspaceId = useActiveWorkspaceId();
  const canCreate = usePermission('transaction.create');
  const canUpdate = usePermission('transaction.update');
  const canDelete = usePermission('transaction.delete');
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: accounts, isLoading: accountsLoading } = useAccounts(workspaceId);

  const [activeAccountId] = useActiveAccountId();
  const queryParams = useMemo(
    () => ({ ...params, accountId: activeAccountId ?? undefined }),
    [params, activeAccountId]
  );

  // Back to page 1 when the account changes.
  const prevAccountRef = useRef(activeAccountId);
  useEffect(() => {
    if (prevAccountRef.current !== activeAccountId) {
      prevAccountRef.current = activeAccountId;
      setPage(1);
    }
  }, [activeAccountId, setPage]);

  const { data: transactionResponse, isLoading, error, isFetching } =
    useTransactions(workspaceId, queryParams, { enabled: !isInvalidDateRange });
  const { mutate: addTx, isPending: isAdding } = useCreateTransaction(workspaceId);
  const { mutate: updateTx, isPending: isUpdating } = useUpdateTransaction(workspaceId);
  const { mutate: deleteTx, isPending: isDeleting } = useDeleteTransaction(workspaceId);

  const [formState, setFormState] = useState<FormState>(null);
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
    [addTx]
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
        }
      );
    },
    [formState, updateTx]
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
      setFormState({ mode: 'create', initialValues: templateToInitialValues(t), templateId: t.id }),
    []
  );
  const closeModal = useCallback(() => setFormState(null), []);
  const openEditModal = useCallback((tx: Transaction) => setFormState({ mode: 'edit', transaction: tx }), []);
  const openDeleteTarget = useCallback((tx: Transaction) => setDeleteTarget(tx), []);
  const closeDeleteTarget = useCallback(() => setDeleteTarget(null), []);

  const handleSubmit = formState?.mode === 'create' ? handleCreateTransaction : handleUpdateTransaction;

  const pagination: PaginationState = useMemo(
    () => ({ pageIndex: page - 1, pageSize }),
    [page, pageSize]
  );
  const sorting: SortingState = useMemo(
    () => (sortBy ? [{ id: sortBy, desc: sortDir === 'desc' }] : []),
    [sortBy, sortDir]
  );
  const globalFilter = filters.search ?? '';

  const handleSortingChange: OnChangeFn<SortingState> = useCallback((updater) => {
    const currentSorting: SortingState = sortBy ? [{ id: sortBy, desc: sortDir === 'desc' }] : [];
    const nextSorting = typeof updater === 'function' ? updater(currentSorting) : updater;
    const nextSort = nextSorting[0];
    setSort(nextSort?.id as TransactionSortField | undefined, nextSort?.desc ? 'desc' : 'asc');
  }, [setSort, sortBy, sortDir]);

  const handleGlobalFilterChange: OnChangeFn<string> = useCallback((updater) => {
    const nextSearch = typeof updater === 'function' ? updater(globalFilter) : updater;
    setFilter('search', nextSearch || undefined);
  }, [globalFilter, setFilter]);

  const handleTypeChange = useCallback((value: TransactionType | '') => {
    setFilter('type', value || undefined);
  }, [setFilter]);

  const handleCategoryChange = useCallback((value: string) => {
    setFilter('categoryId', value || undefined);
  }, [setFilter]);

  const handleAccountChange = useCallback((value: string) => {
    setFilter('accountId', value || undefined);
  }, [setFilter]);

  const handleDateFromChange = useCallback((value: string) => {
    setFilter('dateFrom', value || undefined);
  }, [setFilter]);

  const handleDateToChange = useCallback((value: string) => {
    setFilter('dateTo', value || undefined);
  }, [setFilter]);

  const handlePaginationChange: OnChangeFn<PaginationState> = useCallback((updater) => {
    const currentPagination: PaginationState = { pageIndex: page - 1, pageSize };
    const nextPagination = typeof updater === 'function' ? updater(currentPagination) : updater;
    if (nextPagination.pageSize !== pageSize) {
      setPageSize(nextPagination.pageSize);
    } else {
      setPage(nextPagination.pageIndex + 1);
    }
  }, [page, pageSize, setPage, setPageSize]);

  // if (isLoading) return <div className="text-sm text-base-content/60 animate-pulse p-8">Loading finance ledger...</div>;
  if (error) return <div className="text-sm text-error p-8">Failed to load transactions.</div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <FinanceHeader
        onOpenModal={openCreateModal}
        onUseTemplate={openCreateFromTemplate}
        onOpenExport={() => setExportOpen(true)}
        onOpenImport={() => setImportOpen(true)}
      />
      <FinanceStats
        netBalance={false}
        thisMonthNet={false}
        lastMonthNet={false}
      />

      <CategoryStatsTooltip />

      <div className="grid gap-4 rounded-xl border border-base-300 bg-base-100 p-4 md:grid-cols-5">
        <Select aria-label="Filter by transaction type" value={filters.type ?? ''} onChange={(event) => handleTypeChange(event.target.value as TransactionType | '')}>
          <option value="">All types</option>
          <option value="CREDIT">Credit</option>
          <option value="DEBIT">Debit</option>
        </Select>
        <Select aria-label="Filter by account" value={filters.accountId ?? ''} onChange={(event) => handleAccountChange(event.target.value)} disabled={accountsLoading}>
          <option value="">All accounts</option>
          {accounts?.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}{account.isActive ? '' : ' (inactive)'}
            </option>
          ))}
        </Select>
        <Select aria-label="Filter by category" value={filters.categoryId ?? ''} onChange={(event) => handleCategoryChange(event.target.value)} disabled={categoriesLoading}>
          <option value="">All categories</option>
          {categories?.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </Select>
        <Input aria-label="Filter transactions from date" type="date" value={filters.dateFrom ?? ''} onChange={(event) => handleDateFromChange(event.target.value)} />
        <Input aria-label="Filter transactions to date" type="date" min={filters.dateFrom} value={filters.dateTo ?? ''} onChange={(event) => handleDateToChange(event.target.value)} />
        {isInvalidDateRange && (
          <p className="text-xs text-error md:col-span-5">
            &quot;From&quot; date must be on or before the &quot;To&quot; date.
          </p>
        )}
      </div>

      <TransactionTable
        transactions={transactionResponse?.data}
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

      {formState && (formState.mode === 'create' ? canCreate : canUpdate) && (
        <TransactionModal
          key={formState.mode === 'edit' ? formState.transaction.id : `new-${formState.templateId ?? ''}`}
          open={true}
          onClose={closeModal}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          transaction={formState.mode === 'edit' ? formState.transaction : null}
          initialValues={formState.mode === 'create' ? formState.initialValues : undefined}
        />
      )}

      {deleteTarget && canDelete && (
        <ConfirmDialog
          isOpen={true}
          title="Delete transaction"
          description={`Are you sure you want to delete this transaction for ${deleteTarget.amount}? This action cannot be undone.`}
          confirmText="Delete"
          variant="danger"
          onConfirm={handleDeleteTransaction}
          onClose={closeDeleteTarget}
          loading={isDeleting}
        />
      )}

      {exportOpen && workspaceId && (
        <ExportTransactionsModal
          open={true}
          onClose={() => setExportOpen(false)}
          workspaceId={workspaceId}
          initialFilters={{ ...filters, accountId: activeAccountId ?? filters.accountId }}
        />
      )}

      {importOpen && workspaceId && canCreate && (
        <ImportTransactionsModal
          open={true}
          onClose={() => setImportOpen(false)}
          workspaceId={workspaceId}
          activeAccountId={activeAccountId ?? null}
          activeAccountName={accounts?.find((a) => a.id === activeAccountId)?.name}
        />
      )}
    </div>
  );
}