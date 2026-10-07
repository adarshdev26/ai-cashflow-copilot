import { apiFetch, withWorkspace } from '@/lib/api-client';
import type { TransactionTemplateDTO, TemplateInput, TemplatePatch } from '../types';

export const transactionTemplatesApi = {
    list: (ws: string) =>
        apiFetch<TransactionTemplateDTO[]>('/api/transaction-templates', withWorkspace(ws)),
    create: (ws: string, input: TemplateInput) =>
        apiFetch<TransactionTemplateDTO>(
            '/api/transaction-templates',
            withWorkspace(ws, { method: 'POST', body: JSON.stringify(input) }),
        ),
    update: (ws: string, id: string, patch: TemplatePatch) =>
        apiFetch<TransactionTemplateDTO>(
            `/api/transaction-templates/${id}`,
            withWorkspace(ws, { method: 'PATCH', body: JSON.stringify(patch) }),
        ),
    remove: (ws: string, id: string) =>
        apiFetch<{ id: string }>(
            `/api/transaction-templates/${id}`,
            withWorkspace(ws, { method: 'DELETE' }),
        ),
};
