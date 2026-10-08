import { apiFetch, withWorkspace } from '@/lib/api-client';
import type { ReceiptInput, ReceiptMetadata } from '../types';

const base = (txId: string) => `/api/finance/transactions/${txId}/receipt`;

export function getReceiptMap(workspaceId: string, ids: string[]) {
    const qs = new URLSearchParams({ ids: ids.join(',') });
    return apiFetch<Record<string, ReceiptMetadata>>(
        `/api/finance/transactions/receipts?${qs}`,
        withWorkspace(workspaceId),
    );
}

export function uploadReceipt(workspaceId: string, txId: string, input: ReceiptInput) {
    return apiFetch<ReceiptMetadata>(base(txId), {
        ...withWorkspace(workspaceId),
        method: 'POST',
        body: JSON.stringify(input),
    });
}

export function updateReceiptNote(workspaceId: string, txId: string, note: string) {
    return apiFetch<ReceiptMetadata>(base(txId), {
        ...withWorkspace(workspaceId),
        method: 'PATCH',
        body: JSON.stringify({ note }),
    });
}

export function deleteReceipt(workspaceId: string, txId: string) {
    return apiFetch<{ id: string }>(base(txId), {
        ...withWorkspace(workspaceId),
        method: 'DELETE',
    });
}

/** Raw fetch (apiFetch would JSON-parse the body), same pattern as downloadTransactionsCsv. */
export async function fetchReceiptFile(
    workspaceId: string,
    txId: string,
    opts: { download?: boolean } = {},
): Promise<Blob> {
    const qs = opts.download ? '?download=1' : '';
    const res = await fetch(`${base(txId)}/file${qs}`, {
        headers: { 'X-Workspace-Id': workspaceId },
    });
    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? 'Could not load receipt');
    }
    return res.blob();
}

/** File -> base64 (no data: prefix). Safe for large files, unlike btoa(String.fromCharCode(...)). */
export function readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Could not read the file'));
        reader.onload = () => {
            const result = String(reader.result ?? '');
            resolve(result.slice(result.indexOf(',') + 1));
        };
        reader.readAsDataURL(file);
    });
}
