import { apiFetch, withWorkspace } from '@/lib/api-client';
import type { AiInsightsResponse } from '../types';

/** Same local calendar month as FinanceStats / useFinanceSummary. */
export function getDashboardInsightsPeriod(now = new Date()) {
    const y = now.getFullYear();
    const m = now.getMonth();
    const pad = (n: number) => String(n).padStart(2, '0');
    const from = `${y}-${pad(m + 1)}-01`;
    const next = new Date(y, m + 1, 1);
    const to = `${next.getFullYear()}-${pad(next.getMonth() + 1)}-01`;
    return { from, to };
}

export async function getAiInsights(
    workspaceId: string,
    period: { from: string; to: string } = getDashboardInsightsPeriod(),
): Promise<AiInsightsResponse> {
    const params = new URLSearchParams({ from: period.from, to: period.to });
    return apiFetch<AiInsightsResponse>(
        `/api/ai/insights?${params.toString()}`,
        withWorkspace(workspaceId),
    );
}
