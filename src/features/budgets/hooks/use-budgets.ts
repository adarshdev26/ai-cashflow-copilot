'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useActiveWorkspaceId } from '@/features/workspaces/WorkspaceProvider';
import { budgetsApi } from '../api/budgets-api';
import type { CreateBudgetInput, UpdateBudgetInput } from '../types';
import { invalidateReports } from '@/features/reports/hooks/report-invalidation';

export const budgetKeys = {
  all: (workspaceId: string | null | undefined) => ['budgets', workspaceId] as const,
  usage: (workspaceId: string | null | undefined, from: string, to: string) =>
    ['budgets', workspaceId, from, to] as const,
};

export function useBudgetUsage(from: string, to: string) {
  const workspaceId = useActiveWorkspaceId();
  return useQuery({
    queryKey: budgetKeys.usage(workspaceId, from, to),
    queryFn: () => budgetsApi.usage(workspaceId as string, from, to),
    enabled: !!workspaceId,
    placeholderData: keepPreviousData,
  });
}

function useInvalidateBudgets() {
  const queryClient = useQueryClient();
  const workspaceId = useActiveWorkspaceId();
  return () => {
    queryClient.invalidateQueries({ queryKey: budgetKeys.all(workspaceId) });
    invalidateReports(queryClient);
  };
}

export function useCreateBudget() {
  const workspaceId = useActiveWorkspaceId();
  const invalidate = useInvalidateBudgets();
  return useMutation({
    mutationFn: (input: CreateBudgetInput) => budgetsApi.create(workspaceId as string, input),
    onSuccess: invalidate,
  });
}

export function useUpdateBudget() {
  const workspaceId = useActiveWorkspaceId();
  const invalidate = useInvalidateBudgets();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateBudgetInput & { id: string }) =>
      budgetsApi.update(workspaceId as string, id, input),
    onSuccess: invalidate,
  });
}

export function useDeactivateBudget() {
  const workspaceId = useActiveWorkspaceId();
  const invalidate = useInvalidateBudgets();
  return useMutation({
    mutationFn: (id: string) => budgetsApi.deactivate(workspaceId as string, id),
    onSuccess: invalidate,
  });
}
