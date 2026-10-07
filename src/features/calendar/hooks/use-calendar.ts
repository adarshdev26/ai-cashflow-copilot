'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useActiveWorkspaceId } from '@/features/workspaces/WorkspaceProvider';
import { calendarApi } from '../api/calendar-api';

export const calendarKeys = {
    all: ['calendar'] as const,
    month: (workspaceId: string, month: string, accountId: string | undefined, tz: string) =>
        ['calendar', workspaceId, month, accountId ?? 'all', tz] as const,
};

function browserTimeZone(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
        return 'UTC';
    }
}

export function useCalendarMonth(month: string, accountId?: string) {
    const workspaceId = useActiveWorkspaceId();
    const tz = browserTimeZone();
    return useQuery({
        queryKey: calendarKeys.month(workspaceId, month, accountId, tz),
        queryFn: () => calendarApi.month(workspaceId, month, tz, accountId),
        placeholderData: keepPreviousData,
        staleTime: 30 * 1000,
    });
}
