import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useActiveWorkspaceId } from '@/features/workspaces';
import { transactionTemplatesApi } from '../api/transaction-templates-api';
import type { TemplateInput, TemplatePatch } from '../types';

export const templateKeys = {
    all: (workspaceId: string) => ['transaction-templates', workspaceId] as const,
};

export function useTransactionTemplates(options: { enabled?: boolean } = {}) {
    const workspaceId = useActiveWorkspaceId();
    return useQuery({
        queryKey: templateKeys.all(workspaceId),
        queryFn: () => transactionTemplatesApi.list(workspaceId),
        enabled: options.enabled ?? true,
        staleTime: 30 * 1000,
    });
}

function useInvalidateTemplates() {
    const qc = useQueryClient();
    const workspaceId = useActiveWorkspaceId();
    return () => qc.invalidateQueries({ queryKey: templateKeys.all(workspaceId) });
}

export function useCreateTemplate() {
    const workspaceId = useActiveWorkspaceId();
    const queryClient = useQueryClient();
    const done = useInvalidateTemplates();
    return useMutation({
        mutationFn: (input: TemplateInput) => transactionTemplatesApi.create(workspaceId, input),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['plan'] });
            return done();
        },
    });
}

export function useUpdateTemplate() {
    const workspaceId = useActiveWorkspaceId();
    const done = useInvalidateTemplates();
    return useMutation({
        mutationFn: ({ id, patch }: { id: string; patch: TemplatePatch }) =>
            transactionTemplatesApi.update(workspaceId, id, patch),
        onSuccess: done,
    });
}

export function useDeleteTemplate() {
    const workspaceId = useActiveWorkspaceId();
    const queryClient = useQueryClient();
    const done = useInvalidateTemplates();
    return useMutation({
        mutationFn: (id: string) => transactionTemplatesApi.remove(workspaceId, id),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['plan'] });
            return done();
        },
    });
}
