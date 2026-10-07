import { apiFetch, withWorkspace } from '@/lib/api-client';
import type {
    CreateGoalInput,
    GoalContributionInput,
    GoalContributionResponse,
    GoalListResponse,
    GoalResponse,
    UpdateGoalInput,
} from '../types';

export const goalsApi = {
    list: (workspaceId: string, includeArchived = false) =>
        apiFetch<GoalListResponse>(
            `/api/goals${includeArchived ? '?includeArchived=true' : ''}`,
            withWorkspace(workspaceId),
        ),
    create: (workspaceId: string, input: CreateGoalInput) =>
        apiFetch<GoalResponse>(
            '/api/goals',
            withWorkspace(workspaceId, { method: 'POST', body: JSON.stringify(input) }),
        ),
    update: (workspaceId: string, input: UpdateGoalInput) =>
        apiFetch<GoalResponse>(
            `/api/goals/${input.id}`,
            withWorkspace(workspaceId, {
                method: 'PATCH',
                body: JSON.stringify({
                    name: input.name,
                    targetAmount: input.targetAmount,
                    targetDate: input.targetDate,
                    description: input.description,
                }),
            }),
        ),
    contribute: (workspaceId: string, id: string, input: GoalContributionInput) =>
        apiFetch<GoalContributionResponse>(
            `/api/goals/${id}/contributions`,
            withWorkspace(workspaceId, {
                method: 'POST',
                body: JSON.stringify(input),
            }),
        ),
    archive: (workspaceId: string, id: string) =>
        apiFetch<GoalResponse>(
            `/api/goals/${id}`,
            withWorkspace(workspaceId, { method: 'DELETE' }),
        ),
    restore: (workspaceId: string, id: string) =>
        apiFetch<GoalResponse>(
            `/api/goals/${id}/restore`,
            withWorkspace(workspaceId, { method: 'POST' }),
        ),
};
