import { apiFetch, withWorkspace } from '@/lib/api-client';
import type { InsightsRange, InsightsResponse } from '../types';

export function getAiInsights(
    workspaceId: string,
    range: InsightsRange,
    opts: { force?: boolean } = {},
) {
    const params = new URLSearchParams(range);
    if (opts.force) params.set('force', '1');
    return apiFetch<InsightsResponse>(
        `/api/ai/insights?${params.toString()}`,
        withWorkspace(workspaceId),
    );
}