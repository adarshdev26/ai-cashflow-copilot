import { DashboardMetrics } from "../types";
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const res = await fetch('/api/dashboard/metrics', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch dashboard metrics');
  }

  return res.json();
}