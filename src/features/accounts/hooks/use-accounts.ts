import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAccounts, createAccount, updateAccount, deleteAccount } from '../api/accounts-api';
import { financeKeys } from '@/features/finance/hooks/use-finance';
import type { CreateAccountInput, UpdateAccountInput } from '../types';
import { invalidateReports } from '@/features/reports/hooks/report-invalidation';

export const accountKeys = {
    all: (workspaceId: string) => ['accounts', workspaceId] as const,
    list: (workspaceId: string, activeOnly: boolean) =>
        ['accounts', workspaceId, { activeOnly }] as const,
};

export function useAccounts(
    workspaceId: string,
    options: { activeOnly?: boolean; enabled?: boolean } = {},
) {
    const activeOnly = options.activeOnly ?? false;
    return useQuery({
        queryKey: accountKeys.list(workspaceId, activeOnly),
        queryFn: () => getAccounts(workspaceId, { activeOnly }),
        enabled: options.enabled ?? true,
        staleTime: 30 * 1000,
    });
}

export function useCreateAccount(workspaceId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateAccountInput) => createAccount(workspaceId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: accountKeys.all(workspaceId) });
            queryClient.invalidateQueries({ queryKey: ['net-worth', workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['calendar'] });
            invalidateReports(queryClient);
            void queryClient.invalidateQueries({ queryKey: ['plan'] });
        },
    });
}

export function useUpdateAccount(workspaceId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateAccountInput }) =>
            updateAccount(workspaceId, id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: accountKeys.all(workspaceId) });
            queryClient.invalidateQueries({ queryKey: ['net-worth', workspaceId] });
            // Transaction rows include the account name, so refresh the ledger too.
            queryClient.invalidateQueries({ queryKey: financeKeys.all(workspaceId) });
            queryClient.invalidateQueries({ queryKey: ['calendar'] });
            invalidateReports(queryClient);
        },
    });
}

export function useDeleteAccount(workspaceId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteAccount(workspaceId, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: accountKeys.all(workspaceId) });
            queryClient.invalidateQueries({ queryKey: ['net-worth', workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['calendar'] });
            invalidateReports(queryClient);
            void queryClient.invalidateQueries({ queryKey: ['plan'] });
        },
    });
}
