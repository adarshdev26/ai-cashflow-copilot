import { apiFetch, toQuery } from '../../shared/api/admin-api';
import type { Paged } from '../../shared/types';
import type { AuditLogDetail, AuditLogRow } from '../types';

export const adminAuditLogsApi = {
    list: (params: Record<string, unknown>) =>
        apiFetch<Paged<AuditLogRow>>(`/api/admin/audit-logs?${toQuery(params)}`),
    get: (id: string) =>
        apiFetch<{ event: AuditLogDetail }>(`/api/admin/audit-logs/${encodeURIComponent(id)}`),
};
