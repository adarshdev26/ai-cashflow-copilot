import { apiFetch, toQuery } from '../../shared/api/admin-api';
import type { Paged } from '../../shared/types';
import type { ErrorLogRow, SystemHealthResponse } from '../types';

export const adminSystemHealthApi = {
    status: () => apiFetch<SystemHealthResponse>('/api/admin/system-health'),
    errors: (params: Record<string, unknown>) =>
        apiFetch<Paged<ErrorLogRow>>(`/api/admin/system-health/errors?${toQuery(params)}`),
};
