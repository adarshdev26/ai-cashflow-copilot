import { apiFetch, withWorkspace } from '@/lib/api-client';
import { toQueryString } from '../lib/report-filters';
import type { ReportFilters, ReportResponse, ReportTimezoneParams } from '../types';

export function getReport(
    workspaceId: string,
    filters: ReportFilters,
    tz: NonNullable<ReportTimezoneParams['tz']> | number,
    tzOffset?: ReportTimezoneParams['tzOffset'],
    signal?: AbortSignal,
) {
    return apiFetch<ReportResponse>(
        `/api/reports?${toQueryString(filters, tz, tzOffset)}`,
        withWorkspace(workspaceId, { signal }),
    );
}

export async function downloadReportCsv(
    workspaceId: string,
    filters: ReportFilters,
    tz: NonNullable<ReportTimezoneParams['tz']> | number,
    tzOffset?: ReportTimezoneParams['tzOffset'],
) {
    const res = await fetch(`/api/reports/export?${toQueryString(filters, tz, tzOffset)}`, {
        headers: { 'X-Workspace-Id': workspaceId },
    });
    if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? 'Export failed');
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${filters.from}_to_${filters.to}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}
