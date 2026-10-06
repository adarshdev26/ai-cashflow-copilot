import { BalanceTrendPoint, DaysRange } from '../types';
import { apiFetch, withWorkspace } from '@/lib/api-client';

export async function getBalanceTrend(
    workspaceId: string,
    days: DaysRange,
): Promise<BalanceTrendPoint[]> {
    return apiFetch<BalanceTrendPoint[]>(
        `/api/dashboard/balance-trend?days=${days}`,
        withWorkspace(workspaceId),
    );
}
