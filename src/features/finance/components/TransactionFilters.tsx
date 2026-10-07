'use client';

import { FilterDateRange } from '@/components/ui/FilterDateRange';
import { FilterSelect } from '@/components/ui/FilterSelect';
import type { FinancialAccount } from '@/features/accounts/types';
import type { Category } from '@/resources/types';
import type { TransactionFilters as TransactionFilterValues, TransactionType } from '../types';

type Props = {
    filters: TransactionFilterValues;
    categories?: Category[];
    accounts?: FinancialAccount[];
    categoriesLoading: boolean;
    accountsLoading?: boolean;
    isInvalidDateRange: boolean;
    onTypeChange: (value: TransactionType | '') => void;
    onAccountChange?: (value: string) => void;
    onCategoryChange: (value: string) => void;
    onDateFromChange: (value: string) => void;
    onDateToChange: (value: string) => void;
};

export function TransactionFilters({
    filters,
    categories,
    accounts,
    categoriesLoading,
    accountsLoading = false,
    isInvalidDateRange,
    onTypeChange,
    onAccountChange,
    onCategoryChange,
    onDateFromChange,
    onDateToChange,
}: Props) {
    const showAccountFilter = Boolean(onAccountChange);

    return (
        <div className="contents" data-tour="transaction-filters">
            <FilterSelect
                aria-label="Filter by transaction type"
                value={filters.type ?? ''}
                onChange={(event) => onTypeChange(event.target.value as TransactionType | '')}
            >
                <option value="">All types</option>
                <option value="CREDIT">Credit</option>
                <option value="DEBIT">Debit</option>
                <option value="TRANSFER">Transfer</option>
            </FilterSelect>
            {showAccountFilter && (
                <FilterSelect
                    aria-label="Filter by account"
                    value={filters.accountId ?? ''}
                    onChange={(event) => onAccountChange?.(event.target.value)}
                    disabled={accountsLoading}
                >
                    <option value="">All accounts</option>
                    {accounts?.map((account) => (
                        <option key={account.id} value={account.id}>
                            {account.name}
                            {account.isActive ? '' : ' (inactive)'}
                        </option>
                    ))}
                </FilterSelect>
            )}
            <FilterSelect
                aria-label="Filter by category"
                value={filters.categoryId ?? ''}
                onChange={(event) => onCategoryChange(event.target.value)}
                disabled={categoriesLoading}
            >
                <option value="">All categories</option>
                {categories?.map((category) => (
                    <option key={category.id} value={category.id}>
                        {category.name}
                    </option>
                ))}
            </FilterSelect>
            <FilterDateRange
                from={filters.dateFrom ?? ''}
                to={filters.dateTo ?? ''}
                onChange={({ from, to }) => {
                    onDateFromChange(from);
                    onDateToChange(to);
                }}
                error={
                    isInvalidDateRange
                        ? '"From" date must be on or before the "To" date.'
                        : undefined
                }
            />
        </div>
    );
}
