'use client';
import { useState } from 'react';
import { Download } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button, PrimaryButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { notify, getErrorMessage } from '@/lib/toast';
import { MAX_IMPORT_CHARS, parseTransactionCsv, type ParsedCsvRow } from '../lib/transaction-csv';
import type { ImportTransactionsCsvResult } from '../api/finance-csv-api';
import { useImportTransactionsCsv } from '../hooks/use-transaction-csv';

type Props = {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  activeAccountId: string | null;
  activeAccountName?: string;
};

export function ImportTransactionsModal({
  open,
  onClose,
  workspaceId,
  activeAccountId,
  activeAccountName,
}: Props) {
  const { mutateAsync, isPending } = useImportTransactionsCsv(workspaceId);

  const [fileName, setFileName] = useState<string | null>(null);
  const [csv, setCsv] = useState<string | null>(null);
  const [preview, setPreview] = useState<ParsedCsvRow[]>([]);
  const [check, setCheck] = useState<ImportTransactionsCsvResult | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const resetFile = () => {
    setFileName(null);
    setCsv(null);
    setPreview([]);
    setCheck(null);
    setFileError(null);
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // lets the user pick the same file again after fixing it
    resetFile();
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setFileError('Please choose a .csv file.');
      return;
    }
    if (file.size > MAX_IMPORT_CHARS) {
      setFileError('File is too large (max 5 MB).');
      return;
    }

    const text = await file.text();
    setFileName(file.name);
    setCsv(text);
    setPreview(parseTransactionCsv(text).rows.slice(0, 5)); // instant preview, server does the real check

    try {
      const result = await mutateAsync({ csv: text, defaultAccountId: activeAccountId, dryRun: true });
      setCheck(result);
    } catch (error) {
      setFileError(getErrorMessage(error, 'Could not check the file'));
    }
  };

  const handleImport = async () => {
    if (!csv) return;
    try {
      const result = await mutateAsync({ csv, defaultAccountId: activeAccountId, dryRun: false });
      if (result.ok && !result.dryRun) {
        notify.success(`Imported ${result.imported} transactions`);
        onClose();
      } else if (!result.ok) {
        setCheck(result); // data changed since the preview, show the new errors
      }
    } catch (error) {
      notify.error(getErrorMessage(error, 'Import failed'));
    }
  };

  const readyTotal = check && check.ok && check.dryRun ? check.total : 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Import transactions"
      description="Upload a CSV file to add many transactions at once."
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isPending}>Cancel</Button>
          <PrimaryButton onClick={handleImport} loading={isPending} disabled={readyTotal === 0}>
            {readyTotal > 0 ? `Import ${readyTotal} transactions` : 'Import'}
          </PrimaryButton>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 text-sm">
          <p className="text-base-content/70">
            {activeAccountId
              ? <>Rows without a Financial Account go to <span className="font-medium">{activeAccountName ?? 'the selected account'}</span>.</>
              : <>No account is selected, so every row needs a Financial Account value.</>}
          </p>
          <a
            href="/samples/transactions.csv"
            download
            className="inline-flex shrink-0 items-center gap-1 text-primary hover:underline"
          >
            <Download className="h-4 w-4" /> Sample CSV
          </a>
        </div>

        <Input aria-label="CSV file" type="file" accept=".csv,text/csv" onChange={handleFile} disabled={isPending} />

        {fileError && <p className="text-sm text-error">{fileError}</p>}

        {fileName && !fileError && (
          <p className="text-sm text-base-content/60">
            {fileName}{isPending && !check ? ' — checking…' : ''}
          </p>
        )}

        {check && check.ok && check.dryRun && (
          <p className="text-sm text-success">All {check.total} rows are valid and ready to import.</p>
        )}

        {check && !check.ok && (
          <div className="rounded-lg border border-error/30 bg-error/10 p-3">
            <p className="mb-2 text-sm font-medium text-error">
              Nothing was imported. Fix these rows and choose the file again
              {check.errorCount ? ` (${check.errorCount} problems, showing the first ${check.errors.length})` : ''}:
            </p>
            <ul className="max-h-48 space-y-1 overflow-y-auto text-xs text-error">
              {check.errors.map((e, i) => (
                <li key={i}>Row {e.row}: {e.message}</li>
              ))}
            </ul>
          </div>
        )}

        {preview.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-base-300">
            <table className="w-full text-left text-xs">
              <thead className="bg-base-200 text-base-content/60">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Account</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((r) => (
                  <tr key={r.row} className="border-t border-base-200">
                    <td className="px-3 py-2">{r.date.slice(0, 10)}</td>
                    <td className="px-3 py-2">{r.type}</td>
                    <td className="px-3 py-2">{r.amount.toFixed(2)}</td>
                    <td className="px-3 py-2">{r.category ?? '—'}</td>
                    <td className="px-3 py-2">{r.account ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-base-200 px-3 py-2 text-xs text-base-content/50">First {preview.length} rows</p>
          </div>
        )}
      </div>
    </Modal>
  );
}