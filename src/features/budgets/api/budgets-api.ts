import { apiFetch, withWorkspace } from '@/lib/api-client';
import type { BudgetUsageResponse, CreateBudgetInput, UpdateBudgetInput } from '../types';

export const budgetsApi = {
    usage: (workspaceId: string, from: string, to: string) =>
        apiFetch<BudgetUsageResponse>(
            `/api/budgets?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
            withWorkspace(workspaceId),
        ),

    create: (workspaceId: string, input: CreateBudgetInput) =>
        apiFetch<{ budget: { id: string } }>(
            '/api/budgets',
            withWorkspace(workspaceId, { method: 'POST', body: JSON.stringify(input) }),
        ),

    update: (workspaceId: string, id: string, input: UpdateBudgetInput) =>
        apiFetch<{ budget: { id: string } }>(
            `/api/budgets/${id}`,
            withWorkspace(workspaceId, { method: 'PATCH', body: JSON.stringify(input) }),
        ),

    deactivate: (workspaceId: string, id: string) =>
        apiFetch<{ success: boolean }>(
            `/api/budgets/${id}`,
            withWorkspace(workspaceId, { method: 'DELETE' }),
        ),
};
