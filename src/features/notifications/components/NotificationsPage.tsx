'use client';

import { useMemo } from 'react';
import { Check, CheckCheck, X } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { FilterSelect } from '@/components/ui/FilterSelect';
import { notify, getErrorMessage } from '@/lib/ui/toast';
import { useDataTableState } from '@/hooks/list/useDataTableState';
import { usePublicSettings } from '@/features/settings/hooks/use-settings';
import {
    useDismiss,
    useMarkAllRead,
    useMarkRead,
    useNotifications,
    useUnreadCount,
} from '../hooks/use-notifications';
import {
    NOTIFICATION_TYPES,
    NOTIFICATION_TYPE_LABEL,
    isNotificationType,
    type NotificationDTO,
    type NotificationType,
} from '../types';
import { NotificationRow } from './NotificationRow';

type Filters = { read?: 'true' | 'false'; type?: NotificationType };

export function NotificationsPage() {
    const { data: settings } = usePublicSettings();
    const table = useDataTableState<Filters, 'severity'>({
        defaultFilters: { read: undefined, type: undefined },
    });
    const { data, isLoading, isFetching, isError, error, refetch } = useNotifications(
        table.list.params,
    );
    const { data: unread = 0 } = useUnreadCount();
    const markRead = useMarkRead();
    const markAll = useMarkAllRead();
    const dismiss = useDismiss();
    const { mutate: markReadMutate } = markRead;
    const { mutate: dismissMutate } = dismiss;

    const columns = useMemo<ColumnDef<NotificationDTO>[]>(
        () => [
            {
                id: 'notification',
                header: 'Notification',
                enableSorting: false,
                cell: ({ row }) => <NotificationRow item={row.original} />,
            },
            {
                id: 'type',
                header: 'Type',
                enableSorting: false,
                cell: ({ row }) => (
                    <span className="bg-base-200 text-base-content/70 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap">
                        {NOTIFICATION_TYPE_LABEL[row.original.type]}
                    </span>
                ),
            },
            {
                id: 'actions',
                header: '',
                enableSorting: false,
                cell: ({ row }) => {
                    const n = row.original;
                    return (
                        <div className="flex items-center justify-end gap-1">
                            {!n.isRead && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    aria-label="Mark as read"
                                    onClick={() =>
                                        markReadMutate(n.id, {
                                            onError: (e) => notify.error(getErrorMessage(e)),
                                        })
                                    }
                                >
                                    <Check className="h-4 w-4" />
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                aria-label="Dismiss notification"
                                onClick={() =>
                                    dismissMutate(n.id, {
                                        onSuccess: () => notify.success('Notification dismissed'),
                                        onError: (e) => notify.error(getErrorMessage(e)),
                                    })
                                }
                            >
                                <X className="text-error h-4 w-4" />
                            </Button>
                        </div>
                    );
                },
            },
        ],
        [markReadMutate, dismissMutate],
    );

    if (settings?.['features.notificationsEnabled'] === false) {
        return (
            <div className="text-base-content/60 mx-auto max-w-7xl text-sm">
                Notifications are currently turned off.
            </div>
        );
    }

    const totalCount = data?.pagination.totalCount ?? 0;
    const filtersActive = table.activeFilterCount > 0;
    const showError = isError && !data;
    const showEmpty = !isLoading && !isError && totalCount === 0 && !filtersActive;

    return (
        <div className="mx-auto max-w-7xl space-y-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-base-content text-2xl font-bold tracking-tight">
                        Notifications
                    </h1>
                    <p className="text-base-content/60 text-sm">
                        Budget, payment, goal and savings updates for this workspace.
                    </p>
                </div>
                <Button
                    variant="secondary"
                    leftIcon={<CheckCheck className="h-4 w-4" />}
                    disabled={unread === 0}
                    loading={markAll.isPending}
                    onClick={() =>
                        markAll.mutate(undefined, {
                            onSuccess: () => notify.success('All notifications marked as read'),
                            onError: (e) => notify.error(getErrorMessage(e)),
                        })
                    }
                >
                    Mark all as read
                </Button>
            </div>

            {showError ? (
                <div className="border-error/30 bg-error/10 rounded-xl border p-6 text-center">
                    <p className="text-error text-sm">
                        {getErrorMessage(error, 'Failed to load notifications.')}
                    </p>
                    <Button variant="secondary" className="mt-3" onClick={() => void refetch()}>
                        Try again
                    </Button>
                </div>
            ) : showEmpty ? (
                <div className="border-base-300 bg-base-100 rounded-xl border border-dashed p-12 text-center">
                    <p className="text-base-content text-sm font-semibold">All caught up!</p>
                    <p className="text-base-content/60 mt-1 text-sm">
                        No notifications right now. We&apos;ll let you know when something needs
                        your attention.
                    </p>
                </div>
            ) : (
                <div data-tour="notifications-list">
                    <DataTable
                        columns={columns}
                        data={data?.data ?? []}
                        manualPagination
                        manualSorting
                        manualFiltering
                        {...table.dataTableProps}
                        pageCount={data?.pagination.totalPages ?? 1}
                        totalCount={totalCount}
                        totalLabel="notifications"
                        isLoading={isLoading}
                        isFetching={isFetching}
                        activeFilterCount={table.activeFilterCount}
                        onClearFilters={table.clearFilters}
                        filters={
                            <>
                                <FilterSelect
                                    aria-label="Filter by status"
                                    value={table.list.filters.read ?? ''}
                                    onChange={(e) =>
                                        table.list.setFilter(
                                            'read',
                                            e.target.value === 'true' || e.target.value === 'false'
                                                ? e.target.value
                                                : undefined,
                                        )
                                    }
                                >
                                    <option value="">All</option>
                                    <option value="false">Unread</option>
                                    <option value="true">Read</option>
                                </FilterSelect>
                                <FilterSelect
                                    aria-label="Filter by type"
                                    value={table.list.filters.type ?? ''}
                                    onChange={(e) =>
                                        table.list.setFilter(
                                            'type',
                                            isNotificationType(e.target.value)
                                                ? e.target.value
                                                : undefined,
                                        )
                                    }
                                >
                                    <option value="">All types</option>
                                    {NOTIFICATION_TYPES.map((t) => (
                                        <option key={t} value={t}>
                                            {NOTIFICATION_TYPE_LABEL[t]}
                                        </option>
                                    ))}
                                </FilterSelect>
                            </>
                        }
                    />
                </div>
            )}
        </div>
    );
}
