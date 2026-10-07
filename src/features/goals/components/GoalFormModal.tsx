'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { notify } from '@/lib/ui/toast';
import { MAX_GOAL_AMOUNT } from '../lib/validate-goal';
import { useCreateGoal, useUpdateGoal } from '../hooks/use-goals';
import type { Goal } from '../types';

type Props = { isOpen: boolean; onClose: () => void; editing: Goal | null };

export function GoalFormModal({ isOpen, onClose, editing }: Props) {
    const [name, setName] = useState(editing?.name ?? '');
    const [targetAmount, setTargetAmount] = useState(editing ? String(editing.targetAmount) : '');
    const [targetDate, setTargetDate] = useState(editing?.targetDate.slice(0, 10) ?? '');
    const [description, setDescription] = useState(editing?.description ?? '');

    const [nameError, setNameError] = useState('');
    const [targetAmountError, setTargetAmountError] = useState('');
    const [targetDateError, setTargetDateError] = useState('');
    const [error, setError] = useState('');

    const create = useCreateGoal();
    const update = useUpdateGoal();
    const busy = create.isPending || update.isPending;

    async function submit() {
        const amount = Number(targetAmount);
        let ok = true;
        if (!name.trim()) {
            setNameError('Enter a goal name');
            ok = false;
        } else {
            setNameError('');
        }
        if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_GOAL_AMOUNT) {
            setTargetAmountError(
                `Enter a target greater than 0 and no more than ${MAX_GOAL_AMOUNT}`,
            );
            ok = false;
        } else {
            setTargetAmountError('');
        }
        if (!targetDate) {
            setTargetDateError('Choose a target date');
            ok = false;
        } else {
            setTargetDateError('');
        }
        if (!ok) return;
        setError('');

        const input = { name, targetAmount: amount, targetDate, description };
        try {
            if (editing) {
                await update.mutateAsync({ id: editing.id, ...input });
                notify.success('Goal updated');
            } else {
                await create.mutateAsync(input);
                notify.success('Goal created');
            }
            onClose();
        } catch (cause) {
            const message = cause instanceof Error ? cause.message : 'Failed to save goal';
            setError(message);
            notify.error(message);
        }
    }

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            title={editing ? 'Edit goal' : 'Create goal'}
            description="Set a savings target and date."
            closeOnBackdrop={!busy}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={busy}>
                        Cancel
                    </Button>
                    <Button onClick={submit} loading={busy}>
                        {editing ? 'Save changes' : 'Create goal'}
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <div>
                    <label
                        htmlFor="goal-name"
                        className="text-base-content/80 mb-1 block text-sm font-medium"
                    >
                        Goal name
                    </label>
                    <Input
                        id="goal-name"
                        value={name}
                        maxLength={100}
                        aria-invalid={!!nameError}
                        onChange={(event) => {
                            setName(event.target.value);
                            if (nameError) setNameError('');
                        }}
                    />
                    {nameError && <p className="text-error mt-1 text-xs">{nameError}</p>}
                </div>
                <div>
                    <label
                        htmlFor="goal-target"
                        className="text-base-content/80 mb-1 block text-sm font-medium"
                    >
                        Target amount (₹)
                    </label>
                    <Input
                        id="goal-target"
                        type="number"
                        min="0.01"
                        max={MAX_GOAL_AMOUNT}
                        step="0.01"
                        value={targetAmount}
                        aria-invalid={!!targetAmountError}
                        onChange={(event) => {
                            setTargetAmount(event.target.value);
                            if (targetAmountError) setTargetAmountError('');
                        }}
                    />
                    {targetAmountError && (
                        <p className="text-error mt-1 text-xs">{targetAmountError}</p>
                    )}
                </div>
                <div>
                    <label
                        htmlFor="goal-date"
                        className="text-base-content/80 mb-1 block text-sm font-medium"
                    >
                        Target date
                    </label>
                    <Input
                        id="goal-date"
                        type="date"
                        value={targetDate}
                        aria-invalid={!!targetDateError}
                        onChange={(event) => {
                            setTargetDate(event.target.value);
                            if (targetDateError) setTargetDateError('');
                        }}
                    />
                    {targetDateError && (
                        <p className="text-error mt-1 text-xs">{targetDateError}</p>
                    )}
                </div>
                <div>
                    <label
                        htmlFor="goal-description"
                        className="text-base-content/80 mb-1 block text-sm font-medium"
                    >
                        Description
                    </label>
                    <textarea
                        id="goal-description"
                        value={description}
                        maxLength={1000}
                        onChange={(event) => setDescription(event.target.value)}
                        className="textarea textarea-bordered w-full"
                    />
                </div>
                {error && (
                    <p role="alert" className="text-error text-sm">
                        {error}
                    </p>
                )}
            </div>
        </Modal>
    );
}
