import { apiFetch, withWorkspace } from '@/lib/api-client';
import type { NetWorthSummary } from '../lib/net-worth';

export async function getNetWorth(workspaceId: string): Promise<NetWorthSummary> {
    const res = await apiFetch<{ data: NetWorthSummary }>(`/api/net-worth`, {
        ...withWorkspace(workspaceId),
        method: 'GET',
    });
    return res.data;
}
