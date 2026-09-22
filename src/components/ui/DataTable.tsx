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

const DEFAULT_SEARCH_DEBOUNCE_MS = 400;

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  /** Delay before the typed search is applied. Use 0 to apply on every keystroke. */
  searchDebounceMs?: number;
  pageSize?: number;
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
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Search records...',
  searchDebounceMs = DEFAULT_SEARCH_DEBOUNCE_MS,
  pageSize = 5,
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
}: DataTableProps<TData, TValue>) {
  const [localSorting, setLocalSorting] = useState<SortingState>([]);
  const [localGlobalFilter, setLocalGlobalFilter] = useState('');

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

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Search Header Bar */}
      {searchKey && (
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search.value}
              onChange={search.onChange}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div className="text-xs text-slate-500">
            Total: <span className="font-semibold text-slate-700">{totalCount ?? table.getFilteredRowModel().rows.length}</span> entries
          </div>
        </div>
      )}

      {/* Table Element */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-medium">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  return (
                    <th
                      key={header.id}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      className={`py-3 px-6 ${canSort ? 'cursor-pointer select-none hover:text-slate-800' : ''}`}
                    >
                      <div className="flex items-center gap-1.5">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-12 text-center text-slate-500 text-sm">
                  No records found.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-4 px-6 text-slate-700">
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
      {table.getPageCount() > 1 && (
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <button
            onClick={handlePreviousPage}
            disabled={!table.getCanPreviousPage()}
            className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <span className="text-xs text-slate-500">
            Page <span className="font-semibold text-slate-700">{table.getState().pagination.pageIndex + 1}</span> of{' '}
            <span className="font-semibold text-slate-700">{table.getPageCount()}</span>
          </span>
          <button
            onClick={handleNextPage}
            disabled={!table.getCanNextPage()}
            className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}