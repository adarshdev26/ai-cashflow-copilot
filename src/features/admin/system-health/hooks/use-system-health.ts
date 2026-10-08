import { useQuery } from '@tanstack/react-query';
import { adminSystemHealthApi } from '../api/system-health-api';
import { STATUS_REFRESH_MS } from '../lib/constants';

export function useSystemHealth() {
    return useQuery({
        queryKey: ['admin-system-health', 'status'],
        queryFn: () => adminSystemHealthApi.status(),
        staleTime: STATUS_REFRESH_MS,
        refetchInterval: STATUS_REFRESH_MS, // pauses automatically while the tab is hidden
    });
}

export function useSystemHealthErrors(params: Record<string, unknown>, enabled = true) {
    return useQuery({
        queryKey: ['admin-system-health', 'errors', params],
        queryFn: () => adminSystemHealthApi.errors(params),
        placeholderData: (prev) => prev,
        enabled,
    });
}
