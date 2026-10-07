'use client';

import { useState, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { PrimaryButton, Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { CategorySelect } from '@/resources/components/CategorySelect';
import { useCategoryMap } from '@/resources/hooks/use-categories';
import { Transaction, CreateTransactionInput } from '../types';
import { AccountSelect, useAccounts, useActiveAccountId } from '@/features/accounts';
import { useActiveWorkspaceId, usePermission } from '@/features/workspaces';
import { CategoryFormModal } from '@/features/categories/components/CategoryFormModal';

/** Prefill for a NEW transaction (e.g. from a template). Ignored when editing. */
export interface TransactionInitialValues {
    amount?: number | null;
    type?: 'CREDIT' | 'DEBIT';
    description?: string | null;
    accountId?: string | null;
    categoryId?: string | null;
    /** YYYY-MM-DD */
    date?: string;
}

/** Local calendar date as YYYY-MM-DD (toISOString would shift the day in some timezones). */
function toLocalDateISO(d: Date): string {
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
}

interface TransactionModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (values: CreateTransactionInput) => void;
    isSubmitting: boolean;
    error?: string;
    transaction?: Transaction | null;
    initialValues?: TransactionInitialValues;
}

export function TransactionModal({
    open,
    onClose,
    onSubmit,
    isSubmitting,
    error,
    transaction,
    initialValues,
}: TransactionModalProps) {
    const isEdit = !!transaction;
    const title = isEdit ? 'Edit transaction' : 'Add transaction';
    const submitLabel = isEdit ? 'Save changes' : 'Save Transaction';

    const [description, setDescription] = useState(
        transaction?.description || initialValues?.description || '',
    );
    const [amount, setAmount] = useState(
        transaction?.amount
            ? String(transaction.amount)
            : initialValues?.amount != null
              ? String(initialValues.amount)
              : '',
    );
    const [type, setType] = useState<'CREDIT' | 'DEBIT'>(
        (transaction?.type === 'DEBIT' ? 'DEBIT' : transaction?.type === 'CREDIT' ? 'CREDIT' : null) ??
            initialValues?.type ??
            'CREDIT',
    );
    const [categoryId, setCategoryId] = useState<string | null>(
        transaction?.categoryId || initialValues?.categoryId || null,
    );
    // Date shown in the form: the local day of the stored timestamp when editing,
    // today (or the template's date) when creating.
    const [initialDate] = useState(() =>
        transaction
            ? toLocalDateISO(new Date(transaction.createdAt))
            : (initialValues?.date ?? toLocalDateISO(new Date())),
    );
    const [date, setDate] = useState(initialDate);

    const workspaceId = useActiveWorkspaceId();
    const canCreateCategory = usePermission('category.create');
    const [addCategoryOpen, setAddCategoryOpen] = useState(false);
    const categoryMap = useCategoryMap();

    const { data: activeAccounts, isLoading: accountsLoading } = useAccounts(workspaceId, {
        activeOnly: true,
    });
    // null = user hasn't picked; on create we fall back to the first active account.
    const [pickedAccountId, setPickedAccountId] = useState<string | null>(
        transaction?.accountId ?? initialValues?.accountId ?? null,
    );
    const [activeAccountId] = useActiveAccountId();
    const preferredAccountId =
        activeAccountId && activeAccounts?.some((a) => a.id === activeAccountId)
            ? activeAccountId
            : (activeAccounts?.[0]?.id ?? null);
    const accountId = pickedAccountId ?? (isEdit ? null : preferredAccountId);

    const handleSubmit = useCallback(
        (e: React.SyntheticEvent) => {
            e.preventDefault();
            if (!amount || !accountId) return;

            // Only send a date when it differs from the default (today on create, the stored day on
            // edit), so ordinary entries keep their exact creation time and ordering.
            const baseline = isEdit ? initialDate : toLocalDateISO(new Date());

            onSubmit({
                amount: Number(amount),
                type,
                description: description || undefined,
                categoryId,
                accountId,
                ...(date && date !== baseline && { date }),
            });
        },
        [amount, type, description, categoryId, accountId, date, initialDate, isEdit, onSubmit],
    );

    const handleDescriptionChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value),
        [],
    );

    const handleAmountChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value),
        [],
    );

    const handleTypeChange = useCallback(
        (e: React.ChangeEvent<HTMLSelectElement>) => {
            const next = e.target.value as 'CREDIT' | 'DEBIT';
            setType(next);
            // drop the selected category if it doesn't fit the new type
            const cat = categoryId ? categoryMap[categoryId] : null;
            if (cat?.type && cat.type !== 'BOTH' && cat.type !== next) setCategoryId(null);
        },
        [categoryId, categoryMap],
    );

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={title}
            closeOnBackdrop={!isSubmitting}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <PrimaryButton
                        onClick={handleSubmit}
                        loading={isSubmitting}
                        disabled={
                            isSubmitting || !amount || !accountId || (!isEdit && accountsLoading)
                        }
                    >
                        {submitLabel}
                    </PrimaryButton>
                </>
            }
        >
            <form id="transaction-form" onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-error/10 text-error border-error/30 rounded-lg border p-3 text-sm">
                        {error}
                    </div>
                )}

                <div>
                    <label className="text-base-content/80 mb-1 block text-xs font-medium">
                        Description
                    </label>
                    <Input
                        type="text"
                        value={description}
                        onChange={handleDescriptionChange}
                        placeholder="e.g., Client Freelance Payment"
                        maxLength={255}
                    />
                </div>

                <div>
                    <label className="text-base-content/80 mb-1 block text-xs font-medium">
                        Amount
                    </label>
                    <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={amount}
                        onChange={handleAmountChange}
                        placeholder="0.00"
                    />
                </div>

                <div>
                    <label className="text-base-content/80 mb-1 block text-xs font-medium">
                        Type
                    </label>
                    <Select value={type} onChange={handleTypeChange}>
                        <option value="CREDIT">Credit (Income)</option>
                        <option value="DEBIT">Debit (Expense)</option>
                    </Select>
                </div>

                <div>
                    <label className="text-base-content/80 mb-1 block text-xs font-medium">
                        Account
                    </label>
                    <AccountSelect
                        value={accountId}
                        onChange={setPickedAccountId}
                        currentAccount={transaction?.account ?? null}
                    />
                </div>

                <div>
                    <label className="text-base-content/80 mb-1 block text-xs font-medium">
                        Category
                    </label>
                    <CategorySelect
                        value={categoryId}
                        onChange={setCategoryId}
                        transactionType={type}
                        onAddNew={canCreateCategory ? () => setAddCategoryOpen(true) : undefined}
                    />
                </div>

                <div>
                    <label className="text-base-content/80 mb-1 block text-xs font-medium">
                        Date
                    </label>
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
            </form>

            {addCategoryOpen && workspaceId && (
                <CategoryFormModal
                    open
                    onClose={() => setAddCategoryOpen(false)}
                    workspaceId={workspaceId}
                    defaultType={type}
                    onSaved={(created) => {
                        if (created.type === 'BOTH' || created.type === type)
                            setCategoryId(created.id);
                    }}
                />
            )}
        </Modal>
    );
}
