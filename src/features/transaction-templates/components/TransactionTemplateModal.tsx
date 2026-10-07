'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AccountSelect } from '@/features/accounts/components/AccountSelect';
import { CategorySelect } from '@/resources/components/CategorySelect';
import { notify } from '@/lib/ui/toast';
import type { FinancialTransactionType } from '@/features/finance/types';
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

const dateOnly = (iso: string) => iso.slice(0, 10);

export function TransactionTemplateModal({ isOpen, onClose, editing }: Props) {
    const [name, setName] = useState(editing?.name ?? '');
    const [type, setType] = useState<FinancialTransactionType>(editing?.type ?? 'DEBIT');
    const [description, setDescription] = useState(editing?.description ?? '');
    const [amount, setAmount] = useState(editing?.amount != null ? String(editing.amount) : '');
    const [accountId, setAccountId] = useState(editing?.accountId ?? '');
    const [categoryId, setCategoryId] = useState(editing?.categoryId ?? '');
    const [dateMode, setDateMode] = useState<TemplateDateMode>(editing?.dateMode ?? 'TODAY');
    const [fixedDate, setFixedDate] = useState(
        editing?.fixedDate ? dateOnly(editing.fixedDate) : '',
    );
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const markTouched = (key: string) => setTouched((t) => (t[key] ? t : { ...t, [key]: true }));

    const create = useCreateTemplate();
    const update = useUpdateTemplate();
    const busy = create.isPending || update.isPending;

    const trimmedName = name.trim();
    const nameError = !trimmedName ? 'Give the template a name' : '';
    const amountNum = Number(amount);
    const amountError =
        amount.trim() !== '' && (!Number.isFinite(amountNum) || amountNum <= 0)
            ? 'Amount must be greater than 0, or leave it empty'
            : '';
    const fixedDateError = dateMode === 'FIXED' && !fixedDate ? 'Choose a fixed date' : '';

    const showNameError = Boolean((touched.name || submitted) && nameError);
    const showAmountError = Boolean((touched.amount || submitted) && amountError);
    const showFixedDateError = Boolean((touched.fixedDate || submitted) && fixedDateError);

    function changeType(next: FinancialTransactionType) {
        if (next === type) return;
        setType(next);
        setCategoryId('');
    }

    function changeDateMode(next: TemplateDateMode) {
        setDateMode(next);
        if (next === 'FIXED' && !fixedDate) setFixedDate(localTodayISO());
    }

    async function handleSubmit() {
        setSubmitted(true);
        if (nameError || amountError || fixedDateError) return;
        setError('');

        const payload = {
            name: trimmedName,
            type,
            amount: amount.trim() === '' ? null : amountNum,
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
                <div className="bg-base-200 grid grid-cols-2 gap-2 rounded-lg p-1">
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
                    <label
                        htmlFor="tpl-name"
                        className="text-base-content/80 mb-1 block text-sm font-medium"
                    >
                        Template name
                    </label>
                    <Input
                        id="tpl-name"
                        maxLength={80}
                        placeholder="e.g. Morning coffee, Monthly rent"
                        value={name}
                        aria-invalid={showNameError}
                        onChange={(e) => {
                            setName(e.target.value);
                            markTouched('name');
                        }}
                    />
                    {showNameError && <p className="text-error mt-1 text-xs">{nameError}</p>}
                </div>

                <div>
                    <label
                        htmlFor="tpl-description"
                        className="text-base-content/80 mb-1 block text-sm font-medium"
                    >
                        Description{' '}
                        <span className="text-base-content/50 font-normal">(optional)</span>
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
                        <label
                            htmlFor="tpl-amount"
                            className="text-base-content/80 mb-1 block text-sm font-medium"
                        >
                            Amount (₹){' '}
                            <span className="text-base-content/50 font-normal">(optional)</span>
                        </label>
                        <Input
                            id="tpl-amount"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Ask each time"
                            value={amount}
                            aria-invalid={showAmountError}
                            onChange={(e) => {
                                setAmount(e.target.value);
                                markTouched('amount');
                            }}
                        />
                        {showAmountError && (
                            <p className="text-error mt-1 text-xs">{amountError}</p>
                        )}
                    </div>
                    <div>
                        <div className="mb-1 flex items-center justify-between">
                            <label className="text-base-content/80 block text-sm font-medium">
                                Account{' '}
                                <span className="text-base-content/50 font-normal">(optional)</span>
                            </label>
                            {accountId && (
                                <button
                                    type="button"
                                    onClick={() => setAccountId('')}
                                    className="text-base-content/60 hover:text-base-content/80 text-xs"
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
                    <label className="text-base-content/80 mb-1 block text-sm font-medium">
                        Category{' '}
                        <span className="text-base-content/50 font-normal">(optional)</span>
                    </label>
                    <CategorySelect
                        value={categoryId}
                        onChange={(id) => setCategoryId(id ?? '')}
                        transactionType={type}
                    />
                </div>

                <div>
                    <p className="text-base-content/80 mb-1 block text-sm font-medium">Date</p>
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
                                <span className="text-base-content block font-medium">
                                    {m.title}
                                </span>
                                <span className="text-base-content/60 block text-xs">{m.hint}</span>
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
                                aria-invalid={showFixedDateError}
                                onChange={(e) => {
                                    setFixedDate(e.target.value);
                                    markTouched('fixedDate');
                                }}
                            />
                            {showFixedDateError && (
                                <p className="text-error mt-1 text-xs">{fixedDateError}</p>
                            )}
                        </div>
                    )}
                </div>

                {error && <p className="text-error text-sm">{error}</p>}
            </div>
        </Modal>
    );
}
