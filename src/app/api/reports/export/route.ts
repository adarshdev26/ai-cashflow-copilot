import { NextResponse } from 'next/server';
import Papa from 'papaparse';
import { requireWorkspaceAction } from '@/lib/workspaces';
import { buildReportWhere, parseReportParams } from '@/features/reports/lib/report-filters';
import { validateScopedIds } from '@/features/reports/lib/report-queries';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const MAX_ROWS = 50_000;

// Spreadsheet formula-injection guard.
const safe = (v: string | null | undefined) => {
  const s = v ?? '';
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
};

export async function GET(req: Request) {
  try {
    const access = await requireWorkspaceAction(req, 'workspace.read');
    if (!access.ok) return access.response;

    const parsed = parseReportParams(new URL(req.url).searchParams);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const idError = await validateScopedIds(access.workspaceId, parsed.filters);
    if (idError) return NextResponse.json({ error: idError }, { status: 400 });

    // Same where-builder as the report, so UI and CSV can never disagree.
    const where = buildReportWhere(access.workspaceId, parsed.filters, parsed.range);
    const rows = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: MAX_ROWS + 1,
      select: {
        createdAt: true,
        description: true,
        type: true,
        amount: true,
        account: { select: { name: true } },
        category: { select: { name: true } },
      },
    });
    if (rows.length > MAX_ROWS) {
      return NextResponse.json(
        { error: `Too many rows (max ${MAX_ROWS}). Narrow the date range.` },
        { status: 413 }
      );
    }

    const tz = parsed.tz;
    const csv = Papa.unparse({
      fields: ['Date', 'Description', 'Account', 'Category', 'Type', 'Amount'],
      data: rows.map((r) => [
        new Date(r.createdAt.getTime() - tz * 60_000).toISOString().slice(0, 10),
        safe(r.description),
        safe(r.account?.name),
        safe(r.category?.name),
        r.type,
        r.amount.toFixed(2),
      ]),
    });

    const { from, to } = parsed.filters;
    return new NextResponse('\uFEFF' + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="report-${from}_to_${to}.csv"`,
      },
    });
  } catch (error) {
    console.error('Reports export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}