import { DashboardMetrics } from '../types';
import { apiFetch, withWorkspace } from '@/lib/api-client';

export async function getDashboardMetrics(workspaceId: string): Promise<DashboardMetrics> {
  return apiFetch<DashboardMetrics>(
    '/api/dashboard/metrics',
    withWorkspace(workspaceId)
  );
}