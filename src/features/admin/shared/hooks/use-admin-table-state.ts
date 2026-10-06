'use client';

import { useCallback, useMemo } from 'react';
import type { OnChangeFn, PaginationState, SortingState } from '@tanstack/react-table';
import { useListQueryState } from '@/hooks/list/useListQueryState';
import type { UseListQueryStateOptions } from '@/hooks/list/useListQueryState';

type SearchFilters = Record<string, unknown> & { search?: string };

export function useAdminTableState<TFilters extends SearchFilters, TSortField extends string>(
    options: UseListQueryStateOptions<TFilters, TSortField>,
) {
    const list = useListQueryState<TFilters, TSortField>(options);
    const paginationState = useMemo<PaginationState>(
        () => ({ pageIndex: list.page - 1, pageSize: list.pageSize }),
        [list.page, list.pageSize],
    );
    const sortingState = useMemo<SortingState>(
        () => (list.sortBy ? [{ id: list.sortBy, desc: list.sortDir === 'desc' }] : []),
        [list.sortBy, list.sortDir],
    );
    const globalFilter = list.filters.search ?? '';

    const onPaginationChange: OnChangeFn<PaginationState> = useCallback(
        (updater) => {
            const next = typeof updater === 'function' ? updater(paginationState) : updater;
            if (next.pageSize !== list.pageSize) list.setPageSize(next.pageSize);
            else list.setPage(next.pageIndex + 1);
        },
        [paginationState, list],
    );

    const onSortingChange: OnChangeFn<SortingState> = useCallback(
        (updater) => {
            const next = typeof updater === 'function' ? updater(sortingState) : updater;
            if (next[0]) list.setSort(next[0].id as TSortField, next[0].desc ? 'desc' : 'asc');
            else list.setSort(undefined);
        },
        [sortingState, list],
    );

    const onGlobalFilterChange: OnChangeFn<string> = useCallback(
        (updater) => {
            const next = typeof updater === 'function' ? updater(globalFilter) : updater;
            list.setFilter('search', (next || undefined) as TFilters['search']);
        },
        [globalFilter, list],
    );

    return {
        list,
        paginationState,
        sortingState,
        globalFilter,
        onPaginationChange,
        onSortingChange,
        onGlobalFilterChange,
    };
}
