'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AccountSelect } from '@/features/accounts/components/AccountSelect';
import { CategorySelect } from '@/resources/components/CategorySelect';
import { notify } from '@/lib/ui/toast';
import type { TransactionType } from '@/features/finance/types';
import { useCreateTemplate, useUpdateTemplate } from '../hooks/use-transaction-templates';
import { localTodayISO } from '../lib/template-date';
import type { TemplateDateMode, TransactionTemplateDTO } from '../types';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  editing: TransactionTemplateDTO | null;
};

const DATE_MODES: { value: TemplateDateMode; title: string; hint: string }[] = [
  { value: 'TODAY', title: 'Date of use', hint: 'Uses the day you apply the template' },
  { value: 'FIXED', title: 'Fixed date', hint: 'Always uses the date you pick' },
];

/** Fixed dates are stored at 12:00 UTC, so the UTC date part is the calendar day. */
const dateOnly = (iso: string) => iso.slice(0, 10);

export function TransactionTemplateModal({ isOpen, onClose, editing }: Props) {
  const [name, setName] = useState(editing?.name ?? '');
  const [type, setType] = useState<TransactionType>(editing?.type ?? 'DEBIT');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [amount, setAmount] = useState(editing?.amount != null ? String(editing.amount) : '');
  const [accountId, setAccountId] = useState(editing?.accountId ?? '');
  const [categoryId, setCategoryId] = useState(editing?.categoryId ?? '');
  const [dateMode, setDateMode] = useState<TemplateDateMode>(editing?.dateMode ?? 'TODAY');
  const [fixedDate, setFixedDate] = useState(editing?.fixedDate ? dateOnly(editing.fixedDate) : '');
  const [error, setError] = useState('');

  const create = useCreateTemplate();
  const update = useUpdateTemplate();
  const busy = create.isPending || update.isPending;

  function changeType(next: TransactionType) {
    if (next === type) return;
    setType(next);
    setCategoryId(''); // category list is filtered by type
  }

  function changeDateMode(next: TemplateDateMode) {
    setDateMode(next);
    if (next === 'FIXED' && !fixedDate) setFixedDate(localTodayISO());
  }

  async function handleSubmit() {
    const trimmedName = name.trim();
    if (!trimmedName) return setError('Give the template a name');

    let value: number | null = null;
    if (amount.trim() !== '') {
      const n = Number(amount);
      if (!Number.isFinite(n) || n <= 0) {
        return setError('Amount must be greater than 0, or leave it empty');
      }
      value = n;
    }
    if (dateMode === 'FIXED' && !fixedDate) return setError('Choose a fixed date');
    setError('');

    const payload = {
      name: trimmedName,
      type,
      amount: value,
      description: description.trim() || null,
      accountId: accountId || null,
      categoryId: categoryId || null,
      dateMode,
      fixedDate: dateMode === 'FIXED' ? fixedDate : null,
    };

    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, patch: payload });
        notify.success('Template updated');
      } else {
        await create.mutateAsync(payload);
        notify.success('Template created');
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
      title={editing ? 'Edit template' : 'Add template'}
      description="Save a transaction once and reuse it in a couple of clicks."
      closeOnBackdrop={!busy}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={busy}>
            {editing ? 'Save changes' : 'Create template'}
          </Button>
        </>
      }
    >
      <div className="min-h-96 space-y-4">
        {/* Type toggle */}
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-base-200 p-1">
          {(['DEBIT', 'CREDIT'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => changeType(t)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                type === t
                  ? t === 'DEBIT'
                    ? 'bg-base-100 text-error shadow-sm'
                    : 'bg-base-100 text-success shadow-sm'
                  : 'text-base-content/60 hover:text-base-content/80'
              }`}
            >
              {t === 'DEBIT' ? 'Expense' : 'Income'}
            </button>
          ))}
        </div>

        <div>
          <label htmlFor="tpl-name" className="mb-1 block text-sm font-medium text-base-content/80">
            Template name
          </label>
          <Input
            id="tpl-name"
            maxLength={80}
            placeholder="e.g. Morning coffee, Monthly rent"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="tpl-description" className="mb-1 block text-sm font-medium text-base-content/80">
            Description <span className="font-normal text-base-content/50">(optional)</span>
          </label>
          <Input
            id="tpl-description"
            maxLength={255}
            placeholder="Shown on the transaction"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="tpl-amount" className="mb-1 block text-sm font-medium text-base-content/80">
              Amount (₹) <span className="font-normal text-base-content/50">(optional)</span>
            </label>
            <Input
              id="tpl-amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="Ask each time"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-sm font-medium text-base-content/80">
                Account <span className="font-normal text-base-content/50">(optional)</span>
              </label>
              {accountId && (
                <button
                  type="button"
                  onClick={() => setAccountId('')}
                  className="text-xs text-base-content/60 hover:text-base-content/80"
                >
                  Clear
                </button>
              )}
            </div>
            <AccountSelect
              value={accountId || null}
              onChange={(id) => setAccountId(id ?? '')}
              currentAccount={editing?.account ?? null}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-base-content/80">
            Category <span className="font-normal text-base-content/50">(optional)</span>
          </label>
          <CategorySelect
            value={categoryId}
            onChange={(id) => setCategoryId(id ?? '')}
            transactionType={type}
          />
        </div>

        <div>
          <p className="mb-1 block text-sm font-medium text-base-content/80">Date</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {DATE_MODES.map((m) => (
              <label
                key={m.value}
                className={`cursor-pointer rounded-lg border p-3 text-sm transition-colors ${
                  dateMode === m.value
                    ? 'border-primary bg-primary/10'
                    : 'border-base-300 hover:bg-base-200'
                }`}
              >
                <input
                  type="radio"
                  name="tpl-date-mode"
                  className="sr-only"
                  checked={dateMode === m.value}
                  onChange={() => changeDateMode(m.value)}
                />
                <span className="block font-medium text-base-content">{m.title}</span>
                <span className="block text-xs text-base-content/60">{m.hint}</span>
              </label>
            ))}
          </div>
          {dateMode === 'FIXED' && (
            <div className="mt-3">
              <Input
                id="tpl-fixed-date"
                type="date"
                aria-label="Fixed date"
                value={fixedDate}
                onChange={(e) => setFixedDate(e.target.value)}
              />
            </div>
          )}
        </div>

        {error && <p className="text-sm text-error">{error}</p>}
      </div>
    </Modal>
  );
}