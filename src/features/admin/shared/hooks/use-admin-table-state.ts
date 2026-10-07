'use client';

import { useDataTableState } from '@/hooks/list/useDataTableState';
import type { UseListQueryStateOptions } from '@/hooks/list/useListQueryState';

type SearchFilters = Record<string, unknown> & { search?: string };

export function useAdminTableState<TFilters extends SearchFilters, TSortField extends string>(
    options: UseListQueryStateOptions<TFilters, TSortField>,
) {
    const table = useDataTableState<TFilters, TSortField>(options);

    return {
        list: table.list,
        paginationState: table.paginationState,
        sortingState: table.sortingState,
        globalFilter: table.globalFilter,
        onPaginationChange: table.onPaginationChange,
        onSortingChange: table.onSortingChange,
        onGlobalFilterChange: table.onGlobalFilterChange,
        dataTableProps: table.dataTableProps,
        activeFilterCount: table.activeFilterCount,
        clearFilters: table.clearFilters,
    };
}
