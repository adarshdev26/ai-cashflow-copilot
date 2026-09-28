/*
  Example for a future habits list:
  const list = useListQueryState<HabitFilters, HabitSortField>({
    defaultFilters: { search: undefined, completed: undefined },
    defaultSortBy: 'createdAt',
    defaultSortDir: 'desc',
    defaultPageSize: 20,
  });
  const result = useHabits(list.params);
*/
// Filter updates are immediate by design; debounce a search input at the caller when its UX requires it.

import { useCallback, useMemo } from 'react';
import { useFilters } from './useFilters';
import { usePagination, UsePaginationOptions } from './usePagination';
import { SortDirection, useSort } from './useSort';

export type ListQueryParams<TFilters extends Record<string, unknown>, TSortField extends string> = {
  page: number;
  limit: number;
  sortBy?: TSortField;
  sortDir?: SortDirection;
} & TFilters;

export interface UseListQueryStateOptions<TFilters extends Record<string, unknown>, TSortField extends string>
  extends Pick<UsePaginationOptions, 'defaultPage' | 'defaultPageSize' | 'maxPageSize' | 'totalPages' | 'totalCount'> {
  defaultFilters: TFilters;
  defaultSortBy?: TSortField;
  defaultSortDir?: SortDirection;
}

export function useListQueryState<
  TFilters extends Record<string, unknown>,
  TSortField extends string,
>({
  defaultFilters,
  defaultSortBy,
  defaultSortDir = 'desc',
  defaultPage,
  defaultPageSize,
  maxPageSize,
  totalPages,
  totalCount,
}: UseListQueryStateOptions<TFilters, TSortField>) {
  const pagination = usePagination({ defaultPage, defaultPageSize, maxPageSize, totalPages, totalCount });
  const sorting = useSort({ defaultSortBy, defaultSortDir });
  const filterState = useFilters(defaultFilters);

  // Depend on these stable methods, not on the hook result objects (which are new every render).
  const { reset: resetPagination } = pagination;
  const { setSort: setSortField, toggleSort: toggleSortField } = sorting;
  const {
    setFilter: setFilterValue,
    setFilters: setFilterValues,
    resetFilters: resetFilterValues,
  } = filterState;

  const setSort = useCallback((field: TSortField | undefined, direction: SortDirection = 'asc') => {
    setSortField(field, direction);
    resetPagination();
  }, [setSortField, resetPagination]);

  const toggleSort = useCallback((field: TSortField) => {
    toggleSortField(field);
    resetPagination();
  }, [toggleSortField, resetPagination]);

  const setFilter = useCallback(<TKey extends keyof TFilters>(key: TKey, value: TFilters[TKey]) => {
    setFilterValue(key, value);
    resetPagination();
  }, [setFilterValue, resetPagination]);

  const setFilters = useCallback((partialFilters: Partial<TFilters>) => {
    setFilterValues(partialFilters);
    resetPagination();
  }, [setFilterValues, resetPagination]);

  const resetFilters = useCallback(() => {
    resetFilterValues();
    resetPagination();
  }, [resetFilterValues, resetPagination]);

  const resetAll = useCallback(() => {
    resetFilterValues();
    setSortField(defaultSortBy, defaultSortDir);
    resetPagination();
  }, [defaultSortBy, defaultSortDir, resetFilterValues, setSortField, resetPagination]);

  const params = useMemo<ListQueryParams<TFilters, TSortField>>(
    () => ({
      page: pagination.page,
      limit: pagination.pageSize,
      sortBy: sorting.sortBy,
      sortDir: sorting.sortBy ? sorting.sortDir : undefined,
      ...filterState.filters,
    }),
    [pagination.page, pagination.pageSize, sorting.sortBy, sorting.sortDir, filterState.filters]
  );

  return {
    params,
    ...pagination,
    sortBy: sorting.sortBy,
    sortDir: sorting.sortDir,
    setSort,
    toggleSort,
    filters: filterState.filters,
    setFilter,
    setFilters,
    resetFilters,
    hasActiveFilters: filterState.hasActiveFilters,
    resetAll,
  };
}