'use client';

import { useMemo, useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { PrimaryButton } from '@/components/ui/Button';
import { useAccounts } from '@/features/accounts/hooks/use-accounts';
import type { TransferInput } from '../types';

interface EditableTransfer {
    id: string;
    amount: number;
    description?: string | null;
    createdAt: string;
    account?: { id: string } | null;
    toAccount?: { id: string } | null;
}

interface TransferModalProps {
    open: boolean;
    workspaceId: string;
    onClose: () => void;
    onSubmit: (input: TransferInput) => Promise<void> | void;
    isSubmitting?: boolean;
    transfer?: EditableTransfer | null;
}

const today = () => new Date().toISOString().slice(0, 10);

export function TransferModal({
    open,
    workspaceId,
    onClose,
    onSubmit,
    isSubmitting,
    transfer,
}: TransferModalProps) {
    const { data: accounts = [], isLoading } = useAccounts(workspaceId, { activeOnly: true });
    const [fromId, setFromId] = useState(transfer?.account?.id ?? '');
    const [toId, setToId] = useState(transfer?.toAccount?.id ?? '');
    const [amount, setAmount] = useState(transfer ? String(transfer.amount) : '');
    const [date, setDate] = useState(transfer ? transfer.createdAt.slice(0, 10) : today());
    const [note, setNote] = useState(transfer?.description ?? '');
    const [error, setError] = useState('');

    const activeAccounts = useMemo(() => accounts.filter((a) => a.isActive), [accounts]);
    const fromAccount = activeAccounts.find((a) => a.id === fromId);

    // To list: not the chosen From account, and same currency as From.
    const toAccounts = activeAccounts.filter(
        (a) => a.id !== fromId && (!fromAccount || a.currency === fromAccount.currency),
    );

    const amountNum = Number(amount);
    const invalid = !fromId || !toId || fromId === toId || !(amountNum > 0) || !date;

    const handleFromChange = (nextId: string) => {
        setFromId(nextId);
        const nextFrom = activeAccounts.find((a) => a.id === nextId);
        const selectedTo = activeAccounts.find((a) => a.id === toId);
        if (nextId === toId || (selectedTo && nextFrom?.currency !== selectedTo.currency)) {
            setToId('');
        }
    };

    const swap = () => {
        setFromId(toId);
        setToId(fromId);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (invalid) return setError('Select two different accounts and enter a valid amount');
        setError('');
        await onSubmit({
            type: 'TRANSFER',
            fromAccountId: fromId,
            toAccountId: toId,
            amount: amountNum,
            date,
            note: note.trim() || null,
        });
    };

    return (
        <Modal open={open} onClose={onClose} title={transfer ? 'Edit Transfer' : 'Transfer Money'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div
                        role="alert"
                        className="bg-error/10 text-error border-error/20 rounded-lg border p-3 text-sm"
                    >
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 items-end gap-2 sm:grid-cols-[1fr_auto_1fr]">
                    <div>
                        <label
                            htmlFor="transfer-from"
                            className="text-base-content/70 mb-1.5 block text-sm font-medium"
                        >
                            From account
                        </label>
                        <Select
                            id="transfer-from"
                            value={fromId}
                            onChange={(e) => handleFromChange(e.target.value)}
                            disabled={isLoading}
                        >
                            <option value="" disabled>
                                {isLoading ? 'Loading…' : 'Select account'}
                            </option>
                            {activeAccounts.map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.name}
                                </option>
                            ))}
                        </Select>
                    </div>

                    <button
                        type="button"
                        onClick={swap}
                        disabled={!fromId && !toId}
                        aria-label="Swap accounts"
                        className="border-base-300 text-base-content/60 hover:text-primary hover:border-primary mb-0.5 flex h-10 w-10 items-center justify-center self-end justify-self-center rounded-full border transition disabled:opacity-40"
                    >
                        <ArrowLeftRight className="h-4 w-4" />
                    </button>

                    <div>
                        <label
                            htmlFor="transfer-to"
                            className="text-base-content/70 mb-1.5 block text-sm font-medium"
                        >
                            To account
                        </label>
                        <Select
                            id="transfer-to"
                            value={toId}
                            onChange={(e) => setToId(e.target.value)}
                            disabled={isLoading || !fromId}
                        >
                            <option value="" disabled>
                                Select account
                            </option>
                            {toAccounts.map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.name}
                                </option>
                            ))}
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label
                            htmlFor="transfer-amount"
                            className="text-base-content/70 mb-1.5 block text-sm font-medium"
                        >
                            Amount
                        </label>
                        <Input
                            id="transfer-amount"
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            required
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="transfer-date"
                            className="text-base-content/70 mb-1.5 block text-sm font-medium"
                        >
                            Date
                        </label>
                        <Input
                            id="transfer-date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div>
                    <label
                        htmlFor="transfer-note"
                        className="text-base-content/70 mb-1.5 block text-sm font-medium"
                    >
                        Note <span className="text-base-content/40">(optional)</span>
                    </label>
                    <Input
                        id="transfer-note"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="e.g. ATM withdrawal"
                        maxLength={255}
                    />
                </div>

                <PrimaryButton
                    type="submit"
                    loading={isSubmitting}
                    disabled={isLoading || isSubmitting || invalid}
                    className="w-full"
                >
                    {transfer ? 'Save Transfer' : 'Transfer'}
                </PrimaryButton>
            </form>
        </Modal>
    );
}
