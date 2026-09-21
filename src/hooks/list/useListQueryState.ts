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

import { useCallback } from 'react';
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

  const setSort = useCallback((field: TSortField | undefined, direction: SortDirection = 'asc') => {
    sorting.setSort(field, direction);
    pagination.reset();
  }, [pagination, sorting]);

  const toggleSort = useCallback((field: TSortField) => {
    sorting.toggleSort(field);
    pagination.reset();
  }, [pagination, sorting]);

  const setFilter = useCallback(<TKey extends keyof TFilters>(key: TKey, value: TFilters[TKey]) => {
    filterState.setFilter(key, value);
    pagination.reset();
  }, [filterState, pagination]);

  const setFilters = useCallback((partialFilters: Partial<TFilters>) => {
    filterState.setFilters(partialFilters);
    pagination.reset();
  }, [filterState, pagination]);

  const resetFilters = useCallback(() => {
    filterState.resetFilters();
    pagination.reset();
  }, [filterState, pagination]);

  const resetAll = useCallback(() => {
    filterState.resetFilters();
    sorting.setSort(defaultSortBy, defaultSortDir);
    pagination.reset();
  }, [defaultSortBy, defaultSortDir, filterState, pagination, sorting]);

  const params: ListQueryParams<TFilters, TSortField> = {
    page: pagination.page,
    limit: pagination.pageSize,
    sortBy: sorting.sortBy,
    sortDir: sorting.sortBy ? sorting.sortDir : undefined,
    ...filterState.filters,
  };

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