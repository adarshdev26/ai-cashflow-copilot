import { apiFetch, withWorkspace } from '@/lib/api-client';
import type {
    NotificationCount,
    NotificationListParams,
    NotificationListResponse,
} from '../types';

function toQuery(params: Record<string, unknown>): string {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
    }
    const s = sp.toString();
    return s ? `?${s}` : '';
}

export const notificationsApi = {
    list: (ws: string, params: NotificationListParams) =>
        apiFetch<NotificationListResponse>(`/api/notifications${toQuery(params)}`, withWorkspace(ws)),
    count: (ws: string) =>
        apiFetch<NotificationCount>('/api/notifications/count', withWorkspace(ws)),
    markRead: (ws: string, id: string) =>
        apiFetch<{ id: string }>(
            `/api/notifications/${encodeURIComponent(id)}`,
            withWorkspace(ws, { method: 'PATCH', body: JSON.stringify({ read: true }) }),
        ),
    markAllRead: (ws: string) =>
        apiFetch<{ updated: number }>(
            '/api/notifications/mark-all-read',
            withWorkspace(ws, { method: 'PATCH' }),
        ),
    dismiss: (ws: string, id: string) =>
        apiFetch<{ id: string }>(
            `/api/notifications/${encodeURIComponent(id)}`,
            withWorkspace(ws, { method: 'DELETE' }),
        ),
};