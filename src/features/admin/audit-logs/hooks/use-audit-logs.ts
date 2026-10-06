import { useQuery } from '@tanstack/react-query';
import { adminAuditLogsApi } from '../api/audit-logs-api';

export function useAuditLogs(params: Record<string, unknown>) {
    return useQuery({
        queryKey: ['admin-audit-logs', 'list', params],
        queryFn: () => adminAuditLogsApi.list(params),
        placeholderData: (prev) => prev,
    });
}

export function useAuditLog(id: string | null) {
    return useQuery({
        queryKey: ['admin-audit-logs', 'detail', id],
        queryFn: () => adminAuditLogsApi.get(id!),
        enabled: !!id,
    });
}
