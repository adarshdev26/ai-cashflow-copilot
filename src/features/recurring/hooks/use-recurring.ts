import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useWorkspaces } from '@/features/workspaces/hooks/use-workspaces';
import { recurringApi } from '../api/recurring-api';
import type { RecurringInput, RecurringPatch } from '../types';
import { invalidateReports } from '@/features/reports/hooks/report-invalidation';

export function useRecurring() {
    // Get the data array and rename it to workspaces to avoid conflicts
    const { data: workspaces } = useWorkspaces();

    // Extract the ID (e.g., from the first workspace in the list)
    const workspaceId = workspaces?.[0]?.workspaceId;
    return useQuery({
        queryKey: ['recurring', workspaceId],
        queryFn: () => recurringApi.list(workspaceId!),
        enabled: !!workspaceId,
    });
}

function useInvalidate() {
    const qc = useQueryClient();
    return () => {
        qc.invalidateQueries({ queryKey: ['recurring'] });
        qc.invalidateQueries({ queryKey: ['transactions'] });
        qc.invalidateQueries({ queryKey: ['dashboard-metrics'] });
        qc.invalidateQueries({ queryKey: ['accounts'] });
        qc.invalidateQueries({ queryKey: ['budgets'] });
        invalidateReports(qc);
    };
}

export function useCreateRecurring() {
    // Get the data array and rename it to workspaces to avoid conflicts
    const { data: workspaces } = useWorkspaces();

    // Extract the ID (e.g., from the first workspace in the list)
    const workspaceId = workspaces?.[0]?.workspaceId;
    const done = useInvalidate();
    return useMutation({
        mutationFn: (input: RecurringInput) => recurringApi.create(workspaceId!, input),
        onSuccess: done,
    });
}

export function useUpdateRecurring() {
    // Get the data array and rename it to workspaces to avoid conflicts
    const { data: workspaces } = useWorkspaces();

    // Extract the ID (e.g., from the first workspace in the list)
    const workspaceId = workspaces?.[0]?.workspaceId;
    const done = useInvalidate();
    return useMutation({
        mutationFn: ({ id, patch }: { id: string; patch: RecurringPatch }) =>
            recurringApi.update(workspaceId!, id, patch),
        onSuccess: done,
    });
}

export function useDeleteRecurring() {
    // Get the data array and rename it to workspaces to avoid conflicts
    const { data: workspaces } = useWorkspaces();

    // Extract the ID (e.g., from the first workspace in the list)
    const workspaceId = workspaces?.[0]?.workspaceId;
    const done = useInvalidate();
    return useMutation({
        mutationFn: (id: string) => recurringApi.remove(workspaceId!, id),
        onSuccess: done,
    });
}
