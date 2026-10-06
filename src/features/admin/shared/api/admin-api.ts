import type { QueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export { apiFetch };
export function toQuery(params: Record<string, unknown>): string {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
    }
    return sp.toString();
}
export function invalidateAdminData(qc: QueryClient) {
    return Promise.all([
        qc.invalidateQueries({ queryKey: ['admin-users'] }),
        qc.invalidateQueries({ queryKey: ['admin-workspaces'] }),
        qc.invalidateQueries({ queryKey: ['admin-audit-logs'] }),
    ]);
}
