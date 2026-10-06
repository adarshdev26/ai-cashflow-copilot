import { apiFetch, withWorkspace } from '@/lib/api-client';
import type { RecurringTransactionDTO, RecurringInput, RecurringPatch } from '../types';

export const recurringApi = {
    list: (ws: string) => apiFetch<RecurringTransactionDTO[]>('/api/recurring', withWorkspace(ws)),
    create: (ws: string, input: RecurringInput) =>
        apiFetch<RecurringTransactionDTO>(
            '/api/recurring',
            withWorkspace(ws, { method: 'POST', body: JSON.stringify(input) }),
        ),
    update: (ws: string, id: string, patch: RecurringPatch) =>
        apiFetch<RecurringTransactionDTO>(
            `/api/recurring/${id}`,
            withWorkspace(ws, { method: 'PATCH', body: JSON.stringify(patch) }),
        ),
    remove: (ws: string, id: string) =>
        apiFetch<{ ok: true }>(`/api/recurring/${id}`, withWorkspace(ws, { method: 'DELETE' })),
};
