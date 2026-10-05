'use client';

import { useState, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  SortingState,
  ColumnDef,
  OnChangeFn,
  PaginationState,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, Search, ArrowUpDown } from 'lucide-react';
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch';
import { SETTINGS_BY_KEY } from '@/lib/settings/registry';
import { usePublicSettings } from '@/features/settings/hooks/use-settings';

const DEFAULT_PAGE_SIZE_OPTIONS = SETTINGS_BY_KEY.tablePageSize.type === 'enum'
  ? SETTINGS_BY_KEY.tablePageSize.options.map(({ value }) => Number(value))
  : [10, 20, 50, 100];

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  /** Delay before the typed search is applied. Use 0 to apply on every keystroke. */
  searchDebounceMs?: number;
  pageSize?: number;
  /** Options for the "Rows per page" selector. */
  pageSizeOptions?: number[];
  density?: 'comfortable' | 'compact';
  manualPagination?: boolean;
  manualFiltering?: boolean;
  manualSorting?: boolean;
  pageCount?: number;
  totalCount?: number;
  pagination?: PaginationState;
  sorting?: SortingState;
  globalFilter?: string;
  onPaginationChange?: OnChangeFn<PaginationState>;
  onSortingChange?: OnChangeFn<SortingState>;
  onGlobalFilterChange?: OnChangeFn<string>;
  searchTourId?: string;
  paginationTourId?: string;
  actionsTourId?: string;
  isLoading?: boolean;
  isFetching?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Search records...',
  searchDebounceMs: configuredSearchDebounceMs,
  pageSize: configuredPageSize,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  density = 'comfortable',
  manualPagination = false,
  manualFiltering = false,
  manualSorting = false,
  pageCount,
  totalCount,
  pagination: controlledPagination,
  sorting: controlledSorting,
  globalFilter: controlledGlobalFilter,
  onPaginationChange: controlledPaginationChange,
  onSortingChange: controlledSortingChange,
  onGlobalFilterChange: controlledGlobalFilterChange,
  searchTourId,
  paginationTourId,
  actionsTourId,
  isLoading = false,
  isFetching = false,
}: DataTableProps<TData, TValue>) {
  const { data: settings } = usePublicSettings();
  const searchDebounceMs = configuredSearchDebounceMs ?? Number(settings?.['ui.searchDebounceMs'] ?? 400);
  const pageSize = configuredPageSize ?? Number(settings?.['ui.defaultPageSize'] ?? 20);
  const [localSorting, setLocalSorting] = useState<SortingState>([]);
  const [localGlobalFilter, setLocalGlobalFilter] = useState('');

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      ...(controlledPagination ? { pagination: controlledPagination } : {}),
      sorting: controlledSorting ?? localSorting,
      globalFilter: controlledGlobalFilter ?? localGlobalFilter,
    },
    onPaginationChange: controlledPaginationChange,
    onSortingChange: controlledSortingChange ?? setLocalSorting,
    onGlobalFilterChange: controlledGlobalFilterChange ?? setLocalGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: manualPagination ? undefined : getPaginationRowModel(),
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
    getFilteredRowModel: manualFiltering ? undefined : getFilteredRowModel(),
    manualPagination,
    manualSorting,
    manualFiltering,
    pageCount: manualPagination ? pageCount : undefined,
    initialState: {
      pagination: { pageSize },
    },
  });

  // Debounced search: input stays instant, table/API only update after a pause.
  const search = useDebouncedSearch(
    table.getState().globalFilter ?? '',
    (value) => table.setGlobalFilter(value),
    searchDebounceMs
  );

  const handlePreviousPage = useCallback(() => table.previousPage(), [table]);
  const handleNextPage = useCallback(() => table.nextPage(), [table]);

  const rowCount = table.getRowModel().rows.length;
  const showSkeleton = isLoading && rowCount === 0;
  const isRefetching = isFetching && !showSkeleton;

  const { pageIndex, pageSize: currentPageSize } = table.getState().pagination;
  const total = totalCount ?? table.getFilteredRowModel().rows.length;
  const from = total === 0 ? 0 : pageIndex * currentPageSize + 1;
  const to = Math.min((pageIndex + 1) * currentPageSize, total);
  // Keep the current size selectable even if it isn't one of the presets (e.g. from the URL).
  const sizeOptions = pageSizeOptions.includes(currentPageSize)
    ? pageSizeOptions
    : [...pageSizeOptions, currentPageSize].sort((a, b) => a - b);

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    table.setPageSize(Number(e.target.value));

  return (
    <div
      className="rounded-xl border border-base-300 bg-base-100 shadow-sm overflow-hidden"
      data-tour={actionsTourId}
    >
      {/* Search Header Bar */}
      {searchKey && (
        <div className="p-4 border-b border-base-200 flex items-center justify-between gap-4 bg-base-200/50">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-base-content/50" />
            <input
              type="text"
              data-tour={searchTourId}
              value={search.value}
              onChange={search.onChange}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-4 py-2 border border-base-300 rounded-lg text-sm bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div className="text-xs text-base-content/60">
            Total: <span className="font-semibold text-base-content/80">{totalCount ?? table.getFilteredRowModel().rows.length}</span> entries
          </div>
        </div>
      )}

      {/* Table Element */}
      <div
        className={`overflow-x-auto transition-opacity ${isRefetching ? 'opacity-60' : 'opacity-100'}`}
        aria-busy={isFetching}
      >
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-base-200 bg-base-200/50 text-base-content/60 font-medium">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  return (
                    <th
                      key={header.id}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      className={`${density === 'compact' ? 'py-2' : 'py-3'} px-6 ${canSort ? 'cursor-pointer select-none hover:text-base-content' : ''}`}
                    >
                      <div className="flex items-center gap-1.5">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && <ArrowUpDown className="h-3.5 w-3.5 text-base-content/50" />}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-base-200">
            {showSkeleton ? (
              Array.from({ length: pageSize }).map((_, rowIndex) => (
                <tr key={`skeleton-${rowIndex}`}>
                  {columns.map((_, colIndex) => (
                    <td key={colIndex} className={`${density === 'compact' ? 'py-2' : 'py-4'} px-6`}>
                      <div className="h-4 w-full max-w-40 rounded bg-base-200 animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-12 text-center text-base-content/60 text-sm">
                  No records found.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-base-200/50 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className={`${density === 'compact' ? 'py-2' : 'py-4'} px-6 text-base-content/80`}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {total > 0 && (
        <div className="p-4 border-t border-base-200 flex flex-wrap items-center justify-between gap-3 bg-base-200/50" data-tour={paginationTourId}>
          <div className="flex items-center gap-4 text-xs text-base-content/60">
            <span>
              Showing <span className="font-semibold text-base-content/80">{from}</span>–
              <span className="font-semibold text-base-content/80">{to}</span> of{' '}
              <span className="font-semibold text-base-content/80">{total}</span> entries
            </span>
            <label className="flex items-center gap-2">
              <span>Rows per page</span>
              <select
                value={currentPageSize}
                onChange={handlePageSizeChange}
                className="rounded-md border border-base-300 bg-base-100 px-2 py-1 text-xs text-base-content/80 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {sizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {table.getPageCount() > 1 && (
            <div className="flex items-center gap-4">
              <button
                onClick={handlePreviousPage}
                disabled={!table.getCanPreviousPage()}
                className="flex items-center gap-1 px-3 py-1.5 border border-base-300 rounded-lg text-xs font-medium text-base-content/80 bg-base-100 hover:bg-base-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <span className="text-xs text-base-content/60">
                Page <span className="font-semibold text-base-content/80">{table.getState().pagination.pageIndex + 1}</span> of{' '}
                <span className="font-semibold text-base-content/80">{table.getPageCount()}</span>
              </span>
              <button
                onClick={handleNextPage}
                disabled={!table.getCanNextPage()}
                className="flex items-center gap-1 px-3 py-1.5 border border-base-300 rounded-lg text-xs font-medium text-base-content/80 bg-base-100 hover:bg-base-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div >
  );
}
