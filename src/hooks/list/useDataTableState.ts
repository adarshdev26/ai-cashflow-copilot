'use client';

import { useCallback, useMemo, useState } from 'react';
import type { OnChangeFn, PaginationState, SortingState } from '@tanstack/react-table';
import { useListQueryState } from './useListQueryState';
import type { UseListQueryStateOptions } from './useListQueryState';

type UseDataTableStateOptions<
    TFilters extends Record<string, unknown>,
    TSortField extends string,
> = UseListQueryStateOptions<TFilters, TSortField> & {
    searchKey?: keyof TFilters & string;
    filterKeys?: readonly (keyof TFilters)[];
};

export function useDataTableState<
    TFilters extends Record<string, unknown>,
    TSortField extends string,
>({
    searchKey = 'search' as keyof TFilters & string,
    filterKeys,
    ...options
}: UseDataTableStateOptions<TFilters, TSortField>) {
    const list = useListQueryState<TFilters, TSortField>(options);
    const [defaults] = useState(() => options.defaultFilters);
    const [resolvedFilterKeys] = useState<readonly (keyof TFilters)[]>(
        () =>
            filterKeys ??
            (Object.keys(options.defaultFilters).filter((key) => key !== searchKey) as (keyof TFilters)[]),
    );
    const { setFilter, setFilters, setPage, setPageSize, setSort } = list;
    const paginationState = useMemo<PaginationState>(
        () => ({ pageIndex: list.page - 1, pageSize: list.pageSize }),
        [list.page, list.pageSize],
    );
    const sortingState = useMemo<SortingState>(
        () => (list.sortBy ? [{ id: list.sortBy, desc: list.sortDir === 'desc' }] : []),
        [list.sortBy, list.sortDir],
    );
    const searchValue = list.filters[searchKey];
    const globalFilter = typeof searchValue === 'string' ? searchValue : '';

    const onPaginationChange: OnChangeFn<PaginationState> = useCallback(
        (updater) => {
            const next = typeof updater === 'function' ? updater(paginationState) : updater;
            if (next.pageSize !== list.pageSize) setPageSize(next.pageSize);
            else setPage(next.pageIndex + 1);
        },
        [list.pageSize, paginationState, setPage, setPageSize],
    );

    const onSortingChange: OnChangeFn<SortingState> = useCallback(
        (updater) => {
            const next = typeof updater === 'function' ? updater(sortingState) : updater;
            if (next[0]) setSort(next[0].id as TSortField, next[0].desc ? 'desc' : 'asc');
            else setSort(undefined);
        },
        [setSort, sortingState],
    );

    const onGlobalFilterChange: OnChangeFn<string> = useCallback(
        (updater) => {
            const next = typeof updater === 'function' ? updater(globalFilter) : updater;
            setFilter(searchKey, (next || undefined) as TFilters[typeof searchKey]);
        },
        [globalFilter, searchKey, setFilter],
    );

    const activeFilterCount = useMemo(
        () =>
            resolvedFilterKeys.filter((key) => {
                const value = list.filters[key];
                return (
                    value !== '' &&
                    value !== undefined &&
                    value !== null &&
                    !Object.is(value, defaults[key])
                );
            }).length,
        [defaults, list.filters, resolvedFilterKeys],
    );

    const clearFilters = useCallback(() => {
        const filtersToClear = Object.fromEntries(
            resolvedFilterKeys.map((key) => [key, defaults[key]]),
        ) as Partial<TFilters>;
        setFilters(filtersToClear);
    }, [defaults, resolvedFilterKeys, setFilters]);

    const dataTableProps = useMemo(
        () => ({
            pagination: paginationState,
            sorting: sortingState,
            globalFilter,
            onPaginationChange,
            onSortingChange,
            onGlobalFilterChange,
        }),
        [
            paginationState,
            sortingState,
            globalFilter,
            onPaginationChange,
            onSortingChange,
            onGlobalFilterChange,
        ],
    );

    return {
        list,
        ...list,
        paginationState,
        sortingState,
        globalFilter,
        onPaginationChange,
        onSortingChange,
        onGlobalFilterChange,
        dataTableProps,
        activeFilterCount,
        clearFilters,
    };
}
