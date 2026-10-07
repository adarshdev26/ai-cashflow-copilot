import { apiFetch, withWorkspace } from '@/lib/api-client';
import type { CalendarMonthResponse } from '../types';

export const calendarApi = {
    month: (workspaceId: string, month: string, tz: string, accountId?: string) => {
        const params = new URLSearchParams({ month, tz });
        if (accountId) params.set('accountId', accountId);
        return apiFetch<CalendarMonthResponse>(
            `/api/calendar?${params.toString()}`,
            withWorkspace(workspaceId),
        );
    },
};
