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

const DEFAULT_PAGE_SIZE_OPTIONS =
    SETTINGS_BY_KEY.tablePageSize.type === 'enum'
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
    const searchDebounceMs =
        configuredSearchDebounceMs ?? Number(settings?.['ui.searchDebounceMs'] ?? 400);
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
        searchDebounceMs,
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
            className="border-base-300 bg-base-100 overflow-hidden rounded-xl border shadow-sm"
            data-tour={actionsTourId}
        >
            {/* Search Header Bar */}
            {searchKey && (
                <div className="border-base-200 bg-base-200/50 flex items-center justify-between gap-4 border-b p-4">
                    <div className="relative w-full max-w-sm">
                        <Search className="text-base-content/50 absolute top-2.5 left-3 h-4 w-4" />
                        <input
                            type="text"
                            data-tour={searchTourId}
                            value={search.value}
                            onChange={search.onChange}
                            placeholder={searchPlaceholder}
                            className="border-base-300 bg-base-100 focus:ring-primary/20 focus:border-primary w-full rounded-lg border py-2 pr-4 pl-9 text-sm focus:ring-2 focus:outline-none"
                        />
                    </div>
                    <div className="text-base-content/60 text-xs">
                        Total:{' '}
                        <span className="text-base-content/80 font-semibold">
                            {totalCount ?? table.getFilteredRowModel().rows.length}
                        </span>{' '}
                        entries
                    </div>
                </div>
            )}

            {/* Table Element */}
            <div
                className={`overflow-x-auto transition-opacity ${isRefetching ? 'opacity-60' : 'opacity-100'}`}
                aria-busy={isFetching}
            >
                <table className="w-full border-collapse text-left text-sm">
                    <thead>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr
                                key={headerGroup.id}
                                className="border-base-200 bg-base-200/50 text-base-content/60 border-b font-medium"
                            >
                                {headerGroup.headers.map((header) => {
                                    const canSort = header.column.getCanSort();
                                    return (
                                        <th
                                            key={header.id}
                                            onClick={
                                                canSort
                                                    ? header.column.getToggleSortingHandler()
                                                    : undefined
                                            }
                                            className={`${density === 'compact' ? 'py-2' : 'py-3'} px-6 ${canSort ? 'hover:text-base-content cursor-pointer select-none' : ''}`}
                                        >
                                            <div className="flex items-center gap-1.5">
                                                {flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext(),
                                                )}
                                                {canSort && (
                                                    <ArrowUpDown className="text-base-content/50 h-3.5 w-3.5" />
                                                )}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        ))}
                    </thead>
                    <tbody className="divide-base-200 divide-y">
                        {showSkeleton ? (
                            Array.from({ length: pageSize }).map((_, rowIndex) => (
                                <tr key={`skeleton-${rowIndex}`}>
                                    {columns.map((_, colIndex) => (
                                        <td
                                            key={colIndex}
                                            className={`${density === 'compact' ? 'py-2' : 'py-4'} px-6`}
                                        >
                                            <div className="bg-base-200 h-4 w-full max-w-40 animate-pulse rounded" />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : table.getRowModel().rows.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="text-base-content/60 p-12 text-center text-sm"
                                >
                                    No records found.
                                </td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map((row) => (
                                <tr key={row.id} className="hover:bg-base-200/50 transition-colors">
                                    {row.getVisibleCells().map((cell) => (
                                        <td
                                            key={cell.id}
                                            className={`${density === 'compact' ? 'py-2' : 'py-4'} text-base-content/80 px-6`}
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            )}
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
                <div
                    className="border-base-200 bg-base-200/50 flex flex-wrap items-center justify-between gap-3 border-t p-4"
                    data-tour={paginationTourId}
                >
                    <div className="text-base-content/60 flex items-center gap-4 text-xs">
                        <span>
                            Showing{' '}
                            <span className="text-base-content/80 font-semibold">{from}</span>–
                            <span className="text-base-content/80 font-semibold">{to}</span> of{' '}
                            <span className="text-base-content/80 font-semibold">{total}</span>{' '}
                            entries
                        </span>
                        <label className="flex items-center gap-2">
                            <span>Rows per page</span>
                            <select
                                value={currentPageSize}
                                onChange={handlePageSizeChange}
                                className="border-base-300 bg-base-100 text-base-content/80 focus:ring-primary/20 focus:border-primary rounded-md border px-2 py-1 text-xs focus:ring-2 focus:outline-none"
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
                                className="border-base-300 text-base-content/80 bg-base-100 hover:bg-base-200 flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </button>
                            <span className="text-base-content/60 text-xs">
                                Page{' '}
                                <span className="text-base-content/80 font-semibold">
                                    {table.getState().pagination.pageIndex + 1}
                                </span>{' '}
                                of{' '}
                                <span className="text-base-content/80 font-semibold">
                                    {table.getPageCount()}
                                </span>
                            </span>
                            <button
                                onClick={handleNextPage}
                                disabled={!table.getCanNextPage()}
                                className="border-base-300 text-base-content/80 bg-base-100 hover:bg-base-200 flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
