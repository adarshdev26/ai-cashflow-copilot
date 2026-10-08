import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteReceipt, getReceiptMap, updateReceiptNote, uploadReceipt } from '../api/receipt-api';
import type { ReceiptInput } from '../types';

// Starts with ['transactions', workspaceId], so existing transaction
// mutations refresh receipt indicators with no changes to use-finance.ts.
export const receiptKeys = {
    all: (workspaceId: string) => ['transactions', workspaceId, 'receipts'] as const,
    map: (workspaceId: string, ids: string[]) =>
        ['transactions', workspaceId, 'receipts', [...ids].sort()] as const,
};

/** One request for the whole page: { [transactionId]: ReceiptMetadata }. */
export function useReceiptMap(workspaceId: string, ids: string[]) {
    return useQuery({
        queryKey: receiptKeys.map(workspaceId, ids),
        queryFn: () => getReceiptMap(workspaceId, ids),
        enabled: Boolean(workspaceId) && ids.length > 0,
        placeholderData: keepPreviousData,
        staleTime: 60 * 1000,
    });
}

// Receipts carry no money, so only receipt queries are invalidated.
export function useUploadReceipt(workspaceId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ txId, input }: { txId: string; input: ReceiptInput }) =>
            uploadReceipt(workspaceId, txId, input),
        onSuccess: () => qc.invalidateQueries({ queryKey: receiptKeys.all(workspaceId) }),
    });
}

export function useUpdateReceiptNote(workspaceId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ txId, note }: { txId: string; note: string }) =>
            updateReceiptNote(workspaceId, txId, note),
        onSuccess: () => qc.invalidateQueries({ queryKey: receiptKeys.all(workspaceId) }),
    });
}

export function useDeleteReceipt(workspaceId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (txId: string) => deleteReceipt(workspaceId, txId),
        onSuccess: () => qc.invalidateQueries({ queryKey: receiptKeys.all(workspaceId) }),
    });
}