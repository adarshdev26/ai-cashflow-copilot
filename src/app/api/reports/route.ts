import { NextResponse } from 'next/server';
import { getSystemNumber } from '@/lib/settings/server';
import { requireWorkspaceAction } from '@/lib/auth/workspaces';
import { parseReportParams } from '@/features/reports/lib/report-filters';
import type { ReportApiError } from '@/features/reports/types';
import {
    buildReport,
    ReportSeriesTooLargeError,
    validateScopedIds,
} from '@/features/reports/lib/report-queries';
import { enforceWorkspaceFeature } from "@/lib/plans/server";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const access = await requireWorkspaceAction(req, 'workspace.read');
        if (!access.ok) return access.response;

        const blocked = await enforceWorkspaceFeature(access.workspaceId, 'reports');
        if (blocked) return blocked;

        const parsed = parseReportParams(
            new URL(req.url).searchParams,
            await getSystemNumber('limits.reportMaxDays'),
        );
        if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

        const idError = await validateScopedIds(access.workspaceId, parsed.filters);
        if (idError) return NextResponse.json({ error: idError }, { status: 400 });

        const report = await buildReport(
            access.workspaceId,
            parsed.filters,
            parsed.range,
            parsed.tz,
            parsed.timeZone,
        );
        return NextResponse.json(report);
    } catch (error) {
        if (error instanceof ReportSeriesTooLargeError) {
            const payload: ReportApiError = { code: error.code, message: error.message };
            return NextResponse.json(payload, { status: 422 });
        }
        console.error('Reports error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
