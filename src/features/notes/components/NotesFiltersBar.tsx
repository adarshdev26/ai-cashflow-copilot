'use client';

import { Search, X, SlidersHorizontal, Archive } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import type {
    NoteCategoryFilter,
    NoteFilters,
    NoteSortBy,
    NoteSortDir,
    NoteStatusFilter,
} from '../types';
import { NOTE_CATEGORIES } from '../lib/validate-note';

interface NotesFiltersBarProps {
    filters: NoteFilters;
    onFiltersChange: (next: NoteFilters) => void;
    onReset: () => void;
    totalCount: number;
    filteredCount: number;
    archivedCount?: number;
}

export function NotesFiltersBar({
    filters,
    onFiltersChange,
    onReset,
    totalCount,
    filteredCount,
    archivedCount = 0,
}: NotesFiltersBarProps) {
    const search = filters.search ?? '';
    const status = filters.status ?? 'ALL';
    const category = filters.category ?? 'ALL';
    const sortBy = filters.sortBy ?? 'createdAt';
    const sortDir = filters.sortDir ?? 'desc';

    const hasActiveFilters = Boolean(
        search.trim() ||
        status !== 'ALL' ||
        category !== 'ALL' ||
        sortBy !== 'createdAt' ||
        sortDir !== 'desc',
    );

    const handleSearchChange = (val: string) => {
        onFiltersChange({ ...filters, search: val });
    };

    const handleStatusChange = (newStatus: NoteStatusFilter) => {
        onFiltersChange({ ...filters, status: newStatus });
    };

    const handleCategoryChange = (newCategory: NoteCategoryFilter) => {
        onFiltersChange({ ...filters, category: newCategory });
    };

    const handleSortChange = (combinedSort: string) => {
        const [field, dir] = combinedSort.split(':') as [NoteSortBy, NoteSortDir];
        onFiltersChange({ ...filters, sortBy: field, sortDir: dir });
    };

    const sortValue = `${sortBy}:${sortDir}`;

    return (
        <div className="border-base-300 bg-base-100 space-y-4 rounded-xl border p-4 shadow-sm">
            {/* Top row: Search input + Status Tabs + Reset */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                {/* Search */}
                <div className="relative min-w-0 flex-1">
                    <Search className="text-base-content/40 pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                        type="text"
                        placeholder="Search notes by title or content..."
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pr-9 pl-9"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => handleSearchChange('')}
                            aria-label="Clear search"
                            className="text-base-content/40 hover:text-base-content absolute top-1/2 right-3 -translate-y-1/2 p-0.5"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Status Segmented Tabs */}
                <div className="bg-base-200/80 inline-flex shrink-0 rounded-lg p-1 text-xs font-medium">
                    {(
                        [
                            { id: 'ALL' as const, label: 'All' },
                            { id: 'PENDING' as const, label: 'Pending' },
                            { id: 'COMPLETED' as const, label: 'Completed' },
                            {
                                id: 'ARCHIVED' as const,
                                label:
                                    archivedCount > 0
                                        ? `Archived (${archivedCount})`
                                        : 'Archived',
                            },
                        ]
                    ).map((tab) => {
                        const isActive = status === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => handleStatusChange(tab.id)}
                                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all ${
                                    isActive
                                        ? 'bg-base-100 text-base-content font-semibold shadow-xs'
                                        : 'text-base-content/70 hover:text-base-content'
                                }`}
                            >
                                {tab.id === 'ARCHIVED' && (
                                    <Archive className="h-3 w-3 opacity-70" />
                                )}
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Bottom row: Category filter + Sort options + Result count + Reset */}
            <div className="border-base-200 text-base-content/70 flex flex-wrap items-center justify-between gap-3 border-t pt-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5">
                        <SlidersHorizontal className="text-base-content/50 h-3.5 w-3.5" />
                        <span className="text-base-content/60 font-medium">Category:</span>
                        <Select
                            value={category}
                            onChange={(e) =>
                                handleCategoryChange(e.target.value as NoteCategoryFilter)
                            }
                            className="text-xs"
                        >
                            <option value="ALL">All Categories</option>
                            {NOTE_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat.charAt(0) + cat.slice(1).toLowerCase()}
                                </option>
                            ))}
                        </Select>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className="text-base-content/60 font-medium">Sort:</span>
                        <Select
                            value={sortValue}
                            onChange={(e) => handleSortChange(e.target.value)}
                            className="text-xs"
                        >
                            <option value="createdAt:desc">Newest First</option>
                            <option value="createdAt:asc">Oldest First</option>
                            <option value="title:asc">Title (A-Z)</option>
                            <option value="title:desc">Title (Z-A)</option>
                            <option value="priority:desc">Priority (High-Low)</option>
                            <option value="priority:asc">Priority (Low-High)</option>
                            <option value="amount:desc">Amount (High-Low)</option>
                            <option value="amount:asc">Amount (Low-High)</option>
                        </Select>
                    </div>

                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onReset}
                            className="text-primary h-8 gap-1 text-xs"
                        >
                            <X className="h-3 w-3" />
                            Clear filters
                        </Button>
                    )}
                </div>

                <div className="text-base-content/50 text-[11px]">
                    Showing <span className="text-base-content font-semibold">{filteredCount}</span>{' '}
                    of <span className="text-base-content font-semibold">{totalCount}</span> notes
                </div>
            </div>
        </div>
    );
}
