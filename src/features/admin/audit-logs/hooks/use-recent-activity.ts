import { useQuery } from '@tanstack/react-query';
import { adminAuditLogsApi } from '../api/audit-logs-api';

export function useRecentActivity(limit = 8) {
    return useQuery({
        queryKey: ['admin-audit-logs', 'recent', limit],
        queryFn: () =>
            adminAuditLogsApi.list({ page: 1, limit, sortBy: 'createdAt', sortDir: 'desc' }),
        staleTime: 30_000,
    });
}
