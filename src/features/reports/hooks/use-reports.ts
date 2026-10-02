import { useQuery } from '@tanstack/react-query';
import { useWorkspace } from '@/features/workspaces';
import { getReport } from '../api/reports-api';
import type { ReportFilters, ReportTimezoneParams } from '../types';

export const reportKeys = {
  all: ['reports'] as const,
  detail: (
    workspaceId: string,
    filters: ReportFilters,
    tz: NonNullable<ReportTimezoneParams['tz']> | number,
    tzOffset?: ReportTimezoneParams['tzOffset']
  ) =>
    ['reports', workspaceId, filters, tz, tzOffset] as const,
};

export function useReport(
  filters: ReportFilters,
  tz: NonNullable<ReportTimezoneParams['tz']> | number,
  tzOffset?: ReportTimezoneParams['tzOffset']
) {
  const { active } = useWorkspace();
  return useQuery({
    queryKey: reportKeys.detail(active.workspaceId, filters, tz, tzOffset),
    queryFn: ({ signal }) => getReport(active.workspaceId, filters, tz, tzOffset, signal),
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[1] === active.workspaceId ? previousData : undefined,
    staleTime: 1000 * 60,
  });
}
