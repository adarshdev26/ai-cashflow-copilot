import { NextResponse } from 'next/server';

import { requireWorkspaceAccess } from '@/lib/auth/workspaces';
import { parsePeriod } from '@/lib/budgets/budgets';
import {
    FinancialInsightsError,
    getFinancialInsights,
} from '@/services/ai/financial-insights.service';

export const dynamic = 'force-dynamic';

function statusForInsightsError(error: FinancialInsightsError): number {
    return error.code === 'INVALID_PERIOD' ? 400 : 500;
}

export async function GET(req: Request) {
    try {
        const access = await requireWorkspaceAccess(req, 'VIEWER');
        if (!access.ok) return access.response;

        const period = parsePeriod(new URL(req.url).searchParams);
        if ('error' in period) {
            return NextResponse.json({ error: period.error }, { status: 400 });
        }

        const result = await getFinancialInsights({
            workspaceId: access.workspaceId,
            from: period.from,
            to: period.to,
        });

        return NextResponse.json({
            success: true,
            insights: result.insights,
        });
    } catch (error) {
        if (error instanceof FinancialInsightsError) {
            console.error('AI insights failed:', error.code);
            return NextResponse.json(
                { error: error.message },
                { status: statusForInsightsError(error) },
            );
        }

        console.error('AI insights unexpected error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
