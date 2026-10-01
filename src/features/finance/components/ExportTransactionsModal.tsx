'use client';
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button, PrimaryButton } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { useCategories } from '@/resources/hooks/use-categories';
import { useAccounts } from '@/features/accounts';
import { notify, getErrorMessage } from '@/lib/toast';
import { downloadTransactionsCsv } from '../api/finance-csv-api';
import type { TransactionFilters } from '../types';

type Props = {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  initialFilters: TransactionFilters;
};

export function ExportTransactionsModal({ open, onClose, workspaceId, initialFilters }: Props) {
  const [filters, setFilters] = useState<TransactionFilters>(initialFilters);
  const [busy, setBusy] = useState(false);
  const { data: categories } = useCategories();
  const { data: accounts } = useAccounts(workspaceId);

  const set = <K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K] | '') =>
    setFilters((f) => ({ ...f, [key]: value || undefined }));

  const invalidRange = Boolean(filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo);

  const handleExport = async () => {
    setBusy(true);
    try {
      await downloadTransactionsCsv(workspaceId, filters);
      notify.success('Export downloaded');
      onClose();
    } catch (e) {
      notify.error(getErrorMessage(e, 'Export failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Export transactions"
      description="Downloads every transaction that matches these filters, not just the current page."
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <PrimaryButton onClick={handleExport} loading={busy} disabled={invalidRange}>Export CSV</PrimaryButton>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Input aria-label="From date" type="date" value={filters.dateFrom ?? ''} onChange={(e) => set('dateFrom', e.target.value)} />
        <Input aria-label="To date" type="date" min={filters.dateFrom} value={filters.dateTo ?? ''} onChange={(e) => set('dateTo', e.target.value)} />
        <Select aria-label="Type" value={filters.type ?? ''} onChange={(e) => set('type', e.target.value as 'CREDIT' | 'DEBIT' | '')}>
          <option value="">All types</option>
          <option value="CREDIT">Credit</option>
          <option value="DEBIT">Debit</option>
        </Select>
        <Select aria-label="Category" value={filters.categoryId ?? ''} onChange={(e) => set('categoryId', e.target.value)}>
          <option value="">All categories</option>
          {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select aria-label="Account" value={filters.accountId ?? ''} onChange={(e) => set('accountId', e.target.value)}>
          <option value="">All accounts</option>
          {accounts?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </Select>
        <Input aria-label="Search description" placeholder="Search description" value={filters.search ?? ''} onChange={(e) => set('search', e.target.value)} />
        {invalidRange && <p className="text-xs text-red-600 md:col-span-2">&quot;From&quot; date must be on or before the &quot;To&quot; date.</p>}
      </div>
    </Modal>
  );
}