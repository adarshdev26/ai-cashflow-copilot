import 'server-only';
import type { InsightsResponse } from '../types';
import { buildCandidates } from './candidates';
import { getFinancialAnalytics, type AnalyticsRange } from './financial-analytics';
import { generateInsights } from './generate-insights';

export async function computeInsights(
    workspaceId: string,
    range: AnalyticsRange,
): Promise<InsightsResponse> {
    const analytics = await getFinancialAnalytics(workspaceId, range);
    const candidates = analytics.current.count === 0 ? [] : buildCandidates(analytics);

    const body: InsightsResponse = {
        insights: [],
        generatedAt: new Date().toISOString(),
        period: { from: range.from.toISOString(), to: range.to.toISOString() },
        cached: false,
    };

    if (candidates.length > 0) {
        body.insights = await generateInsights(candidates, analytics.currency);
    }

    return body;
}
