'use client';

import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { FinancialAccount } from '@/features/accounts/types';
import type { Category } from '@/resources/types';
import type { TransactionFilters as TransactionFilterValues, TransactionType } from '../types';

type Props = {
  filters: TransactionFilterValues;
  categories?: Category[];
  accounts?: FinancialAccount[];
  categoriesLoading: boolean;
  accountsLoading: boolean;
  isInvalidDateRange: boolean;
  onTypeChange: (value: TransactionType | '') => void;
  onAccountChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
};

export function TransactionFilters({
  filters,
  categories,
  accounts,
  categoriesLoading,
  accountsLoading,
  isInvalidDateRange,
  onTypeChange,
  onAccountChange,
  onCategoryChange,
  onDateFromChange,
  onDateToChange,
}: Props) {
  return (
    <div className="grid gap-4 rounded-xl border border-base-300 bg-base-100 p-4 md:grid-cols-5">
      <Select
        aria-label="Filter by transaction type"
        value={filters.type ?? ''}
        onChange={(event) => onTypeChange(event.target.value as TransactionType | '')}
      >
        <option value="">All types</option>
        <option value="CREDIT">Credit</option>
        <option value="DEBIT">Debit</option>
      </Select>
      <Select
        aria-label="Filter by account"
        value={filters.accountId ?? ''}
        onChange={(event) => onAccountChange(event.target.value)}
        disabled={accountsLoading}
      >
        <option value="">All accounts</option>
        {accounts?.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name}{account.isActive ? '' : ' (inactive)'}
          </option>
        ))}
      </Select>
      <Select
        aria-label="Filter by category"
        value={filters.categoryId ?? ''}
        onChange={(event) => onCategoryChange(event.target.value)}
        disabled={categoriesLoading}
      >
        <option value="">All categories</option>
        {categories?.map((category) => (
          <option key={category.id} value={category.id}>{category.name}</option>
        ))}
      </Select>
      <Input
        aria-label="Filter transactions from date"
        type="date"
        value={filters.dateFrom ?? ''}
        onChange={(event) => onDateFromChange(event.target.value)}
      />
      <Input
        aria-label="Filter transactions to date"
        type="date"
        min={filters.dateFrom}
        value={filters.dateTo ?? ''}
        onChange={(event) => onDateToChange(event.target.value)}
      />
      {isInvalidDateRange && (
        <p className="text-xs text-error md:col-span-5">
          &quot;From&quot; date must be on or before the &quot;To&quot; date.
        </p>
      )}
    </div>
  );
}
