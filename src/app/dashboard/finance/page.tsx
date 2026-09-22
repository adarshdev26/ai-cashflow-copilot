'use client';
import { useState, useCallback } from "react";
import { OnChangeFn, PaginationState, SortingState } from '@tanstack/react-table';
import {
  useTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  FinanceHeader,
  TransactionTable,
  TransactionModal,
  FinanceStats
} from '@/features/finance';
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

type FormState = { mode: 'create' } | { mode: 'edit'; transaction: Transaction } | null;

const defaultTransactionFilters: TransactionFilters = {
  search: undefined,
  type: undefined,
  categoryId: undefined,
  dateFrom: undefined,
  dateTo: undefined,
};

export default function FinancePage() {
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
    defaultPageSize: 20,
  });
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  const { data: transactionResponse, isLoading, error } = useTransactions(params);
  const { mutate: addTx, isPending: isAdding } = useCreateTransaction();
  const { mutate: updateTx, isPending: isUpdating } = useUpdateTransaction();
  const { mutate: deleteTx, isPending: isDeleting } = useDeleteTransaction();

  const [formState, setFormState] = useState<FormState>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);

  const isSubmitting = isAdding || isUpdating;

  const handleCreateTransaction = useCallback(
    (data: CreateTransactionInput) => {
      addTx(data, {
        onSuccess: () => setFormState(null),
        onError: (error) => console.error('Failed to create transaction:', error),
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
          onSuccess: () => setFormState(null),
          onError: (error) => console.error('Failed to update transaction:', error),
        }
      );
    },
    [formState, updateTx]
  );

  const handleDeleteTransaction = useCallback(() => {
    if (!deleteTarget) return;
    deleteTx(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: (error) => console.error('Failed to delete transaction:', error),
    });
  }, [deleteTarget, deleteTx]);

  const openCreateModal = useCallback(() => setFormState({ mode: 'create' }), []);
  const closeModal = useCallback(() => setFormState(null), []);
  const openEditModal = useCallback((tx: Transaction) => setFormState({ mode: 'edit', transaction: tx }), []);
  const openDeleteTarget = useCallback((tx: Transaction) => setDeleteTarget(tx), []);
  const closeDeleteTarget = useCallback(() => setDeleteTarget(null), []);

  const handleSubmit = formState?.mode === 'create' ? handleCreateTransaction : handleUpdateTransaction;

  const pagination: PaginationState = { pageIndex: page - 1, pageSize };
  const sorting: SortingState = sortBy ? [{ id: sortBy, desc: sortDir === 'desc' }] : [];
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

  const handleDateFromChange = useCallback((value: string) => {
    setFilter('dateFrom', value || undefined);
  }, [setFilter]);

  const handleDateToChange = useCallback((value: string) => {
    setFilter('dateTo', value || undefined);
  }, [setFilter]);

  const handlePaginationChange: OnChangeFn<PaginationState> = useCallback((updater) => {
    const currentPagination: PaginationState = { pageIndex: page - 1, pageSize };
    const nextPagination = typeof updater === 'function' ? updater(currentPagination) : updater;
    setPage(nextPagination.pageIndex + 1);
    if (nextPagination.pageSize !== pageSize) {
      setPageSize(nextPagination.pageSize);
    }
  }, [page, pageSize, setPage, setPageSize]);

  if (isLoading) return <div className="text-sm text-slate-500 animate-pulse p-8">Loading finance ledger...</div>;
  if (error) return <div className="text-sm text-red-600 p-8">Failed to load transactions.</div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <FinanceHeader onOpenModal={openCreateModal} />
      <FinanceStats />

      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-4">
        <Select aria-label="Filter by transaction type" value={filters.type ?? ''} onChange={(event) => handleTypeChange(event.target.value as TransactionType | '')}>
          <option value="">All types</option>
          <option value="CREDIT">Credit</option>
          <option value="DEBIT">Debit</option>
        </Select>
        <Select aria-label="Filter by category" value={filters.categoryId ?? ''} onChange={(event) => handleCategoryChange(event.target.value)} disabled={categoriesLoading}>
          <option value="">All categories</option>
          {categories?.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </Select>
        <Input aria-label="Filter transactions from date" type="date" value={filters.dateFrom ?? ''} onChange={(event) => handleDateFromChange(event.target.value)} />
        <Input aria-label="Filter transactions to date" type="date" value={filters.dateTo ?? ''} onChange={(event) => handleDateToChange(event.target.value)} />
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
      />

      {formState && (
        <TransactionModal
          key={formState.mode === 'edit' ? formState.transaction.id : 'new'}
          open={true}
          onClose={closeModal}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          transaction={formState.mode === 'edit' ? formState.transaction : null}
        />
      )}

      {deleteTarget && (
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
    </div>
  );
}