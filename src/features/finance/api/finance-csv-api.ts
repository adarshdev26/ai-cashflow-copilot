import type { TransactionFilters } from '../types';
import { apiFetch, withWorkspace } from '@/lib/api-client';
import type { CsvRowError } from '../lib/transaction-csv';

export async function downloadTransactionsCsv(workspaceId: string, filters: TransactionFilters) {
  const qs = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });

  const res = await fetch(`/api/finance/transactions/export?${qs}`, {
    headers: { 'X-Workspace-Id': workspaceId },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? 'Export failed');
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export type ImportTransactionsCsvInput = {
  csv: string;
  defaultAccountId: string | null;
  dryRun: boolean;
};

export type ImportTransactionsCsvResult =
  | { ok: true; dryRun: true; total: number }
  | { ok: true; dryRun: false; imported: number }
  | { ok: false; errors: CsvRowError[]; errorCount?: number };

export async function importTransactionsCsv(
  workspaceId: string,
  input: ImportTransactionsCsvInput
): Promise<ImportTransactionsCsvResult> {
  return apiFetch<ImportTransactionsCsvResult>('/api/finance/transactions/import', {
    ...withWorkspace(workspaceId),
    method: 'POST',
    body: JSON.stringify(input),
  });
}