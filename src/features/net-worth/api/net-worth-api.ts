import { apiFetch, withWorkspace } from '@/lib/api-client';
import type { NetWorthHistoryPoint, NetWorthSummary } from '../lib/net-worth';

export async function getNetWorth(workspaceId: string): Promise<NetWorthSummary> {
    const res = await apiFetch<{ data: NetWorthSummary }>(`/api/net-worth`, {
        ...withWorkspace(workspaceId),
        method: 'GET',
    });
    return res.data;
}

export async function getNetWorthHistory(
    workspaceId: string,
    range: string = '6m',
): Promise<NetWorthHistoryPoint[]> {
    const res = await apiFetch<{ data: NetWorthHistoryPoint[] }>(
        `/api/net-worth/history?range=${range}`,
        {
            ...withWorkspace(workspaceId),
            method: 'GET',
        },
    );
    return res.data;
}
