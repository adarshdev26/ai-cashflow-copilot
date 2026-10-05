import { useQuery } from '@tanstack/react-query';
import { adminDashboardApi } from '../api/dashboard-api';

export const adminDashboardKey = ['admin-dashboard', 'overview'] as const;

export function useAdminDashboard() {
  return useQuery({ queryKey: adminDashboardKey, queryFn: adminDashboardApi.get, staleTime: 60_000 });
}