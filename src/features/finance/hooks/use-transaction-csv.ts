import { useMutation, useQueryClient } from '@tanstack/react-query';
import { importTransactionsCsv, type ImportTransactionsCsvInput } from '../api/finance-csv-api';
import { financeKeys } from './use-finance';

export function useImportTransactionsCsv(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ImportTransactionsCsvInput) => importTransactionsCsv(workspaceId, input),
    onSuccess: (result, input) => {
      // A dry run or a validation failure changes nothing, so keep the caches.
      if (input.dryRun || !result.ok) return;
      queryClient.invalidateQueries({ queryKey: financeKeys.all(workspaceId) });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['accounts', workspaceId] });
    },
  });
}