'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AccountSelect } from '@/features/accounts/components/AccountSelect';
import { CategorySelect } from '@/resources/components/CategorySelect';
import { notify } from '@/lib/toast';
import { useCreateRecurring, useUpdateRecurring } from '../hooks/use-recurring';
import type { RecurringFrequency, RecurringTransactionDTO, TxType } from '../types';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  editing: RecurringTransactionDTO | null;
};

const FREQUENCIES: { value: RecurringFrequency; label: string }[] = [
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
];

/** Local calendar date as YYYY-MM-DD (toISOString would shift the day in some timezones). */
function todayLocal(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Schedule dates are stored at 12:00 UTC, so the UTC date part is the calendar day. */
const dateOnly = (iso: string) => iso.slice(0, 10);

export function formatScheduleDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

const selectClass =
  'block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 ' +
  'focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

export function RecurringModal({ isOpen, onClose, editing }: Props) {
  const [description, setDescription] = useState(editing?.description ?? '');
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '');
  const [type, setType] = useState<TxType>(editing?.type ?? 'DEBIT');
  const [accountId, setAccountId] = useState(editing?.accountId ?? '');
  const [categoryId, setCategoryId] = useState(editing?.categoryId ?? '');
  const [frequency, setFrequency] = useState<RecurringFrequency>(editing?.frequency ?? 'MONTHLY');
  const [startDate, setStartDate] = useState(editing ? dateOnly(editing.startDate) : todayLocal());
  const [endDate, setEndDate] = useState(editing?.endDate ? dateOnly(editing.endDate) : '');
  const [error, setError] = useState('');

  const create = useCreateRecurring();
  const update = useUpdateRecurring();
  const busy = create.isPending || update.isPending;

  function changeType(next: TxType) {
    if (next === type) return;
    setType(next);
    setCategoryId(''); // category list is filtered by type
  }

  async function handleSubmit() {
    const value = Number(amount);
    if (!accountId) return setError('Select an account');
    if (!Number.isFinite(value) || value <= 0) return setError('Enter an amount greater than 0');
    if (!startDate) return setError('Choose a start date');
    if (endDate && endDate < startDate) return setError('End date must be on or after the start date');
    setError('');

    const payload = {
      accountId,
      categoryId: categoryId || null,
      description: description.trim() || null,
      amount: value,
      type,
      frequency,
      startDate,
      endDate: endDate || null, // explicit null so a cleared end date is saved
    };

    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, patch: payload });
        notify.success('Recurring transaction updated');
      } else {
        await create.mutateAsync(payload);
        notify.success('Recurring transaction created');
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  }

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={editing ? 'Edit recurring transaction' : 'Add recurring transaction'}
      description="Income or expenses that repeat on a schedule."
      closeOnBackdrop={!busy}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={busy}>
            {editing ? 'Save changes' : 'Create schedule'}
          </Button>
        </>
      }
    >
      <div className="min-h-96 space-y-4">
        {/* Type toggle */}
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
          {(['DEBIT', 'CREDIT'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => changeType(t)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${type === t
                ? t === 'DEBIT'
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'bg-white text-emerald-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              {t === 'DEBIT' ? 'Expense' : 'Income'}
            </button>
          ))}
        </div>

        <div>
          <label htmlFor="rec-description" className="mb-1 block text-sm font-medium text-slate-700">
            Description
          </label>
          <Input
            id="rec-description"
            maxLength={255}
            placeholder="e.g. Rent, Salary, Netflix"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="rec-amount" className="mb-1 block text-sm font-medium text-slate-700">
              Amount (₹)
            </label>
            <Input
              id="rec-amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="rec-frequency" className="mb-1 block text-sm font-medium text-slate-700">
              Repeats
            </label>
            <select
              id="rec-frequency"
              className={selectClass}
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
            >
              {FREQUENCIES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Account</label>
            <AccountSelect value={accountId || null} onChange={(id) => setAccountId(id ?? '')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
            <CategorySelect
              value={categoryId}
              onChange={(id) => setCategoryId(id ?? '')}
              transactionType={type}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="rec-start" className="mb-1 block text-sm font-medium text-slate-700">
              Start date
            </label>
            <Input
              id="rec-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="rec-end" className="mb-1 block text-sm font-medium text-slate-700">
              End date <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <Input
              id="rec-end"
              type="date"
              min={startDate}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {editing && (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Next occurrence:{' '}
            <span className="font-medium text-slate-900">{formatScheduleDate(editing.nextRunAt)}</span>
            . Changing the start date or frequency recalculates it. Transactions already created are
            not changed.
          </p>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}