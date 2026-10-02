import { NextResponse } from 'next/server';
import { requireWorkspaceAction } from '@/lib/workspaces';
import { parseReportParams } from '@/features/reports/lib/report-filters';
import { buildReport, validateScopedIds } from '@/features/reports/lib/report-queries';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const access = await requireWorkspaceAction(req, 'workspace.read');
    if (!access.ok) return access.response;

    const parsed = parseReportParams(new URL(req.url).searchParams);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const idError = await validateScopedIds(access.workspaceId, parsed.filters);
    if (idError) return NextResponse.json({ error: idError }, { status: 400 });

    const report = await buildReport(
      access.workspaceId,
      parsed.filters,
      parsed.range,
      parsed.tz
    );
    return NextResponse.json(report);
  } catch (error) {
    console.error('Reports error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}