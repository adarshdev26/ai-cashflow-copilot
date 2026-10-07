import {
    Transaction,
    CreateTransactionInput,
    TransactionListParams,
    TransactionListResponse,
    UpdateTransactionInput,
    TransferInput,
} from '../types';
import { apiFetch, withWorkspace } from '@/lib/api-client';

export async function getTransactions(
    workspaceId: string,
    params: TransactionListParams = {},
): Promise<TransactionListResponse> {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
            searchParams.set(key, String(value));
        }
    });

    const query = searchParams.toString();
    return apiFetch<TransactionListResponse>(
        `/api/finance/transactions${query ? `?${query}` : ''}`,
        withWorkspace(workspaceId),
    );
}

export async function createTransaction(
    workspaceId: string,
    data: CreateTransactionInput,
): Promise<Transaction> {
    return apiFetch<Transaction>('/api/finance/transactions', {
        ...withWorkspace(workspaceId),
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function createTransfer(workspaceId: string, data: TransferInput): Promise<Transaction> {
    return apiFetch<Transaction>('/api/finance/transactions', {
        ...withWorkspace(workspaceId),
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updateTransfer(
    workspaceId: string,
    id: string,
    data: TransferInput,
): Promise<Transaction> {
    return apiFetch<Transaction>(`/api/finance/transactions/${id}`, {
        ...withWorkspace(workspaceId),
        method: 'PATCH',
        body: JSON.stringify(data),
    });
}

export async function updateTransaction(
    workspaceId: string,
    id: string,
    data: UpdateTransactionInput,
): Promise<Transaction> {
    return apiFetch<Transaction>(`/api/finance/transactions/${id}`, {
        ...withWorkspace(workspaceId),
        method: 'PATCH',
        body: JSON.stringify(data),
    });
}

export async function deleteTransaction(workspaceId: string, id: string): Promise<{ id: string }> {
    return apiFetch<{ id: string }>(`/api/finance/transactions/${id}`, {
        ...withWorkspace(workspaceId),
        method: 'DELETE',
    });
}
