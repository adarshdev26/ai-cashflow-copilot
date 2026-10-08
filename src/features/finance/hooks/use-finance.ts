import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
    getTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    createTransfer,
    updateTransfer,
} from '../api/finance-api';
import {
    CreateTransactionInput,
    TransactionListParams,
    TransferInput,
    UpdateTransactionInput,
} from '../types';
import { invalidateReports } from '@/features/reports/hooks/report-invalidation';
import { NOTIFICATIONS_ROOT_KEY } from '@/features/notifications/hooks/use-notifications';

export const financeKeys = {
    list: (workspaceId: string, params: TransactionListParams) =>
        ['transactions', workspaceId, params] as const,
    all: (workspaceId: string) => ['transactions', workspaceId] as const,
};

export function useTransactions(
    workspaceId: string,
    params: TransactionListParams = {},
    options: { enabled?: boolean } = {},
) {
    return useQuery({
        queryKey: financeKeys.list(workspaceId, params),
        queryFn: () => getTransactions(workspaceId, params),
        // Only reuse previous data when the workspace hasn't changed (same workspaceId in key).
        placeholderData: keepPreviousData,
        enabled: options.enabled ?? true,
        staleTime: 30 * 1000, // 30 seconds
    });
}

export function useCreateTransaction(workspaceId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (newTx: CreateTransactionInput) => createTransaction(workspaceId, newTx),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_ROOT_KEY });
            queryClient.invalidateQueries({ queryKey: financeKeys.all(workspaceId) });
            queryClient.invalidateQueries({ queryKey: ['dashboard-metrics', workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['accounts', workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['budgets', workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['net-worth', workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['calendar'] });
            invalidateReports(queryClient);
        },
    });
}

export function useUpdateTransaction(workspaceId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateTransactionInput }) =>
            updateTransaction(workspaceId, id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_ROOT_KEY });
            queryClient.invalidateQueries({ queryKey: financeKeys.all(workspaceId) });
            queryClient.invalidateQueries({ queryKey: ['dashboard-metrics', workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['accounts', workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['budgets', workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['net-worth', workspaceId] });
            invalidateReports(queryClient);
        },
    });
}

export function useCreateTransfer(workspaceId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: TransferInput) => createTransfer(workspaceId, input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_ROOT_KEY });
            queryClient.invalidateQueries({ queryKey: financeKeys.all(workspaceId) });
            queryClient.invalidateQueries({ queryKey: ['dashboard-metrics', workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['accounts', workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['budgets', workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['net-worth', workspaceId] });
            invalidateReports(queryClient);
        },
    });
}

export function useUpdateTransfer(workspaceId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: TransferInput }) =>
            updateTransfer(workspaceId, id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_ROOT_KEY });
            queryClient.invalidateQueries({ queryKey: financeKeys.all(workspaceId) });
            queryClient.invalidateQueries({ queryKey: ['dashboard-metrics', workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['accounts', workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['budgets', workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['net-worth', workspaceId] });
            invalidateReports(queryClient);
        },
    });
}

export function useDeleteTransaction(workspaceId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteTransaction(workspaceId, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_ROOT_KEY });
            queryClient.invalidateQueries({ queryKey: financeKeys.all(workspaceId) });
            queryClient.invalidateQueries({ queryKey: ['dashboard-metrics', workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['accounts', workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['budgets', workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['net-worth', workspaceId] });
            invalidateReports(queryClient);
        },
    });
}
