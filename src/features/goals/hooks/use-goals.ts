'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useActiveWorkspaceId } from '@/features/workspaces/WorkspaceProvider';
import { goalsApi } from '../api/goals-api';
import { NOTIFICATIONS_ROOT_KEY } from '@/features/notifications/hooks/use-notifications';
import type { CreateGoalInput, GoalContributionInput, UpdateGoalInput } from '../types';

export const goalKeys = {
    all: (workspaceId: string) => ['goals', workspaceId] as const,
    list: (workspaceId: string, includeArchived: boolean) =>
        ['goals', workspaceId, includeArchived] as const,
};

export function useGoals(includeArchived = false, workspaceIdOverride?: string) {
    const activeWorkspaceId = useActiveWorkspaceId();
    const workspaceId = workspaceIdOverride ?? activeWorkspaceId;
    return useQuery({
        queryKey: goalKeys.list(workspaceId, includeArchived),
        queryFn: () => goalsApi.list(workspaceId, includeArchived),
        placeholderData: keepPreviousData,
    });
}

function useInvalidateGoals() {
    const queryClient = useQueryClient();
    const workspaceId = useActiveWorkspaceId();
    return () => {
        queryClient.invalidateQueries({ queryKey: goalKeys.all(workspaceId) });
        queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_ROOT_KEY });
        queryClient.invalidateQueries({ queryKey: ['calendar'] });
    };
}

export function useCreateGoal() {
    const workspaceId = useActiveWorkspaceId();
    const invalidate = useInvalidateGoals();
    return useMutation({
        mutationFn: (input: CreateGoalInput) => goalsApi.create(workspaceId, input),
        onSuccess: invalidate,
    });
}

export function useUpdateGoal() {
    const workspaceId = useActiveWorkspaceId();
    const invalidate = useInvalidateGoals();
    return useMutation({
        mutationFn: (input: UpdateGoalInput) => goalsApi.update(workspaceId, input),
        onSuccess: invalidate,
    });
}

export function useContributeToGoal() {
    const workspaceId = useActiveWorkspaceId();
    const invalidate = useInvalidateGoals();
    return useMutation({
        mutationFn: ({ id, ...input }: GoalContributionInput & { id: string }) =>
            goalsApi.contribute(workspaceId, id, input),
        onSuccess: invalidate,
    });
}

export function useArchiveGoal() {
    const workspaceId = useActiveWorkspaceId();
    const invalidate = useInvalidateGoals();
    return useMutation({
        mutationFn: (id: string) => goalsApi.archive(workspaceId, id),
        onSuccess: invalidate,
    });
}

export function useRestoreGoal() {
    const workspaceId = useActiveWorkspaceId();
    const invalidate = useInvalidateGoals();
    return useMutation({
        mutationFn: (id: string) => goalsApi.restore(workspaceId, id),
        onSuccess: invalidate,
    });
}
