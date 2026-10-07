'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CategorySelect } from '@/resources/components/CategorySelect';
import { notify } from '@/lib/ui/toast';
import { useCreateBudget, useUpdateBudget } from '../hooks/use-budgets';
import type { BudgetUsage } from '../types';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    /** ISO start of the month currently being viewed; new budgets apply from here. */
    periodStart: string;
    editing: BudgetUsage | null;
};

export function BudgetFormModal({ isOpen, onClose, periodStart, editing }: Props) {
    const [categoryId, setCategoryId] = useState(editing?.categoryId ?? '');
    const [amount, setAmount] = useState(editing ? String(editing.amount) : '');
    const [categoryError, setCategoryError] = useState('');
    const [amountError, setAmountError] = useState('');
    const [error, setError] = useState('');

    const create = useCreateBudget();
    const update = useUpdateBudget();
    const busy = create.isPending || update.isPending;

    async function handleSubmit() {
        const value = Number(amount);
        let hasError = false;
        if (!editing && !categoryId) {
            setCategoryError('Select a category');
            hasError = true;
        } else {
            setCategoryError('');
        }
        if (!Number.isFinite(value) || value <= 0) {
            setAmountError('Enter an amount greater than 0');
            hasError = true;
        } else {
            setAmountError('');
        }
        if (hasError) return;
        setError('');

        try {
            if (editing) {
                await update.mutateAsync({ id: editing.id, amount: value });
                notify.success('Budget updated');
            } else {
                await create.mutateAsync({ categoryId, amount: value, startDate: periodStart });
                notify.success('Budget created');
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
            title={editing ? 'Edit budget' : 'Create budget'}
            description="Set a monthly spending limit for a category."
            closeOnBackdrop={!busy}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={busy}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} loading={busy}>
                        {editing ? 'Save changes' : 'Create budget'}
                    </Button>
                </>
            }
        >
            <div className={editing ? 'space-y-4' : 'min-h-80 space-y-4'}>
                {editing ? (
                    <p className="text-base-content/80 text-sm">
                        Category: <span className="font-medium">{editing.category.name}</span>
                    </p>
                ) : (
                    <div>
                        <label className="text-base-content/80 mb-1 block text-sm font-medium">
                            Category
                        </label>
                        <CategorySelect
                            value={categoryId}
                            onChange={(id) => {
                                setCategoryId(id ?? '');
                                if (categoryError) setCategoryError('');
                            }}
                            transactionType="DEBIT"
                        />
                        {categoryError && (
                            <p className="text-error mt-1 text-xs">{categoryError}</p>
                        )}
                    </div>
                )}

                <div>
                    <label
                        htmlFor="budget-amount"
                        className="text-base-content/80 mb-1 block text-sm font-medium"
                    >
                        Monthly amount (₹)
                    </label>
                    <Input
                        id="budget-amount"
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

                {error && <p className="text-error text-sm">{error}</p>}
            </div>
        </Modal>
    );
}
