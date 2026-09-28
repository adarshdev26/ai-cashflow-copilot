import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { getTransactions, createTransaction, updateTransaction, deleteTransaction } from '../api/finance-api';
import { CreateTransactionInput, TransactionListParams, UpdateTransactionInput } from '../types';

export function useTransactions(
  params: TransactionListParams = {},
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: ['transactions', params],
    queryFn: () => getTransactions(params),
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newTx: CreateTransactionInput) => createTransaction(newTx),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransactionInput }) => updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });
}