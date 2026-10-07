'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AccountSelect } from '@/features/accounts/components/AccountSelect';
import { CategorySelect } from '@/resources/components/CategorySelect';
import { notify } from '@/lib/ui/toast';
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

export function formatScheduleDate(iso: string, locale = 'en-IN'): string {
    return new Date(iso).toLocaleDateString(locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
    });
}

const selectClass =
    'block w-full rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-sm text-base-content ' +
    'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';

export function RecurringModal({ isOpen, onClose, editing }: Props) {
    const [description, setDescription] = useState(editing?.description ?? '');
    const [amount, setAmount] = useState(editing ? String(editing.amount) : '');
    const [type, setType] = useState<TxType>(editing?.type ?? 'DEBIT');
    const [accountId, setAccountId] = useState(editing?.accountId ?? '');
    const [categoryId, setCategoryId] = useState(editing?.categoryId ?? '');
    const [frequency, setFrequency] = useState<RecurringFrequency>(editing?.frequency ?? 'MONTHLY');
    const [startDate, setStartDate] = useState(
        editing ? dateOnly(editing.startDate) : todayLocal(),
    );
    const [endDate, setEndDate] = useState(editing?.endDate ? dateOnly(editing.endDate) : '');

    const [accountError, setAccountError] = useState('');
    const [amountError, setAmountError] = useState('');
    const [startDateError, setStartDateError] = useState('');
    const [endDateError, setEndDateError] = useState('');
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
        let ok = true;
        if (!accountId) {
            setAccountError('Select an account');
            ok = false;
        } else {
            setAccountError('');
        }
        if (!Number.isFinite(value) || value <= 0) {
            setAmountError('Enter an amount greater than 0');
            ok = false;
        } else {
            setAmountError('');
        }
        if (!startDate) {
            setStartDateError('Choose a start date');
            ok = false;
        } else {
            setStartDateError('');
        }
        if (endDate && endDate < startDate) {
            setEndDateError('End date must be on or after the start date');
            ok = false;
        } else {
            setEndDateError('');
        }
        if (!ok) return;
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
                        htmlFor="rec-description"
                        className="text-base-content/80 mb-1 block text-sm font-medium"
                    >
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
                        <label
                            htmlFor="rec-amount"
                            className="text-base-content/80 mb-1 block text-sm font-medium"
                        >
                            Amount (₹)
                        </label>
                        <Input
                            id="rec-amount"
                            type="number"
                            min="0"
                            step="0.01"
                            value={amount}
                            aria-invalid={!!amountError}
                            onChange={(e) => {
                                setAmount(e.target.value);
                                if (amountError) setAmountError('');
                            }}
                        />
                        {amountError && <p className="text-error mt-1 text-xs">{amountError}</p>}
                    </div>
                    <div>
                        <label
                            htmlFor="rec-frequency"
                            className="text-base-content/80 mb-1 block text-sm font-medium"
                        >
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
                        <label className="text-base-content/80 mb-1 block text-sm font-medium">
                            Account
                        </label>
                        <AccountSelect
                            value={accountId || null}
                            onChange={(id) => {
                                setAccountId(id ?? '');
                                if (accountError) setAccountError('');
                            }}
                        />
                        {accountError && <p className="text-error mt-1 text-xs">{accountError}</p>}
                    </div>
                    <div>
                        <label className="text-base-content/80 mb-1 block text-sm font-medium">
                            Category
                        </label>
                        <CategorySelect
                            value={categoryId}
                            onChange={(id) => setCategoryId(id ?? '')}
                            transactionType={type}
                        />
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label
                            htmlFor="rec-start"
                            className="text-base-content/80 mb-1 block text-sm font-medium"
                        >
                            Start date
                        </label>
                        <Input
                            id="rec-start"
                            type="date"
                            value={startDate}
                            aria-invalid={!!startDateError}
                            onChange={(e) => {
                                setStartDate(e.target.value);
                                if (startDateError) setStartDateError('');
                                if (endDateError) setEndDateError('');
                            }}
                        />
                        {startDateError && (
                            <p className="text-error mt-1 text-xs">{startDateError}</p>
                        )}
                    </div>
                    <div>
                        <label
                            htmlFor="rec-end"
                            className="text-base-content/80 mb-1 block text-sm font-medium"
                        >
                            End date{' '}
                            <span className="text-base-content/50 font-normal">(optional)</span>
                        </label>
                        <Input
                            id="rec-end"
                            type="date"
                            min={startDate}
                            value={endDate}
                            aria-invalid={!!endDateError}
                            onChange={(e) => {
                                setEndDate(e.target.value);
                                if (endDateError) setEndDateError('');
                            }}
                        />
                        {endDateError && <p className="text-error mt-1 text-xs">{endDateError}</p>}
                    </div>
                </div>

                {editing && (
                    <p className="bg-base-200 text-base-content/70 rounded-lg px-3 py-2 text-sm">
                        Next occurrence:{' '}
                        <span className="text-base-content font-medium">
                            {formatScheduleDate(editing.nextRunAt)}
                        </span>
                        . Changing the start date or frequency recalculates it. Transactions already
                        created are not changed.
                    </p>
                )}

                {error && <p className="text-error text-sm">{error}</p>}
            </div>
        </Modal>
    );
}
