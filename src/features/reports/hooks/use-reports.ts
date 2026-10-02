import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useWorkspace } from '@/features/workspaces';
import { getReport } from '../api/reports-api';
import type { ReportFilters } from '../types';

export const reportKeys = {
  all: ['reports'] as const,
  detail: (workspaceId: string, filters: ReportFilters, tz: number) =>
    ['reports', workspaceId, filters, tz] as const,
};

export function useReport(filters: ReportFilters, tz: number) {
  const { active } = useWorkspace();
  return useQuery({
    queryKey: reportKeys.detail(active.workspaceId, filters, tz),
    queryFn: () => getReport(active.workspaceId, filters, tz),
    placeholderData: keepPreviousData, // filters don't flicker while reloading
    staleTime: 1000 * 60,
  });
}