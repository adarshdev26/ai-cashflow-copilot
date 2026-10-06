'use client';

import { useState, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { PrimaryButton, Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
    ACCOUNT_TYPES,
    type AccountType,
    type AccountWithBalance,
    type CreateAccountInput,
} from '../types';
import { ACCOUNT_TYPE_LABELS } from './AccountCard';

interface AddAccountModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (values: CreateAccountInput) => void;
    isSubmitting: boolean;
    error?: string;
    account?: AccountWithBalance | null;
}

export function AddAccountModal({
    open,
    onClose,
    onSubmit,
    isSubmitting,
    error,
    account,
}: AddAccountModalProps) {
    const isEdit = !!account;

    const [name, setName] = useState(account?.name ?? '');
    const [type, setType] = useState<AccountType>(account?.type ?? 'BANK');
    const [openingBalance, setOpeningBalance] = useState(
        account ? String(account.openingBalance) : '',
    );
    const [touched, setTouched] = useState(false);

    const trimmed = name.trim();
    const nameError =
        trimmed.length === 0
            ? 'Account name is required'
            : trimmed.length > 100
              ? 'Max 100 characters'
              : '';
    const balanceInvalid = openingBalance !== '' && !Number.isFinite(Number(openingBalance));

    const handleSubmit = useCallback(
        (e: React.SyntheticEvent) => {
            e.preventDefault();
            setTouched(true);
            if (nameError || balanceInvalid || isSubmitting) return;
            onSubmit({
                name: trimmed,
                type,
                openingBalance: openingBalance === '' ? 0 : Number(openingBalance),
            });
        },
        [nameError, balanceInvalid, isSubmitting, onSubmit, trimmed, type, openingBalance],
    );

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={isEdit ? 'Edit account' : 'Add account'}
            closeOnBackdrop={!isSubmitting}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <PrimaryButton
                        onClick={handleSubmit}
                        loading={isSubmitting}
                        disabled={isSubmitting}
                    >
                        {isEdit ? 'Save changes' : 'Add account'}
                    </PrimaryButton>
                </>
            }
        >
            <form id="account-form" onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="border-error/30 bg-error/10 text-error rounded-lg border p-3 text-sm">
                        {error}
                    </div>
                )}

                <div>
                    <label className="text-base-content/80 mb-1 block text-xs font-medium">
                        Name
                    </label>
                    <Input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., HDFC Savings"
                        maxLength={100}
                        autoFocus
                    />
                    {touched && nameError && <p className="text-error mt-1 text-xs">{nameError}</p>}
                </div>

                <div>
                    <label className="text-base-content/80 mb-1 block text-xs font-medium">
                        Type
                    </label>
                    <Select value={type} onChange={(e) => setType(e.target.value as AccountType)}>
                        {ACCOUNT_TYPES.map((t) => (
                            <option key={t} value={t}>
                                {ACCOUNT_TYPE_LABELS[t]}
                            </option>
                        ))}
                    </Select>
                </div>

                <div>
                    <label className="text-base-content/80 mb-1 block text-xs font-medium">
                        Opening balance
                    </label>
                    <Input
                        type="number"
                        step="0.01"
                        value={openingBalance}
                        onChange={(e) => setOpeningBalance(e.target.value)}
                        placeholder="0.00"
                    />
                    <p className="text-base-content/60 mt-1 text-xs">
                        Use a negative amount for a credit card that starts with debt.
                    </p>
                    {balanceInvalid && (
                        <p className="text-error mt-1 text-xs">Enter a valid amount</p>
                    )}
                </div>
            </form>
        </Modal>
    );
}
