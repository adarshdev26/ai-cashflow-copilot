'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { notify } from '@/lib/ui/toast';
import { formatINR } from '@/features/budgets/utils';
import { useUserLocale } from '@/features/settings/hooks/use-settings';
import { MAX_GOAL_AMOUNT } from '../lib/validate-goal';
import { useContributeToGoal } from '../hooks/use-goals';
import type { Goal, GoalContributionKind } from '../types';

type Props = { goal: Goal | null; mode: GoalContributionKind; onClose: () => void };

export function GoalContributionModal({ goal, mode, onClose }: Props) {
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');
    const mutation = useContributeToGoal();
    const locale = useUserLocale();
    const enteredAmount = amount.trim() ? Number(amount) : 0;
    const previewAmount = Number.isFinite(enteredAmount) && enteredAmount > 0 ? enteredAmount : 0;
    const projectedCurrent = goal
        ? mode === 'REMOVE'
            ? Math.max(goal.currentAmount - previewAmount, 0)
            : goal.currentAmount + previewAmount
        : 0;
    const projectedRemaining = goal ? Math.max(goal.targetAmount - projectedCurrent, 0) : 0;
    async function submit() {
        const value = Number(amount);
        if (!Number.isFinite(value) || value <= 0 || value > MAX_GOAL_AMOUNT) {
            return setError(`Enter an amount greater than 0 and no more than ${MAX_GOAL_AMOUNT}`);
        }
        if (mode === 'REMOVE' && goal && value > goal.currentAmount)
            return setError('Cannot remove more than the current amount');
        if (!goal) return;
        setError('');
        try {
            await mutation.mutateAsync({ id: goal.id, kind: mode, amount: value });
            notify.success(mode === 'ADD' ? 'Money added to goal' : 'Money removed from goal');
            setAmount('');
            onClose();
        } catch (cause) {
            const message = cause instanceof Error ? cause.message : 'Failed to update goal';
            setError(message);
            notify.error(message);
        }
    }
    return (
        <Modal
            open={!!goal}
            onClose={onClose}
            title={mode === 'ADD' ? 'Add money' : 'Remove money'}
            description={goal?.name}
            closeOnBackdrop={!mutation.isPending}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
                        Cancel
                    </Button>
                    <Button onClick={submit} loading={mutation.isPending}>
                        {mode === 'ADD' ? 'Add money' : 'Remove money'}
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                {goal && (
                    <div className="text-base-content/70 flex flex-wrap justify-between gap-2 text-sm">
                        <span>Current: {formatINR(goal.currentAmount, locale)}</span>
                        <span>
                            {mode === 'REMOVE'
                                ? 'Remaining after removal'
                                : 'Remaining after addition'}
                            : {formatINR(projectedRemaining, locale)}
                        </span>
                    </div>
                )}
                <div>
                    <label
                        htmlFor="goal-contribution"
                        className="text-base-content/80 mb-1 block text-sm font-medium"
                    >
                        Amount (₹)
                    </label>
                    <Input
                        id="goal-contribution"
                        type="number"
                        min="0.01"
                        max={mode === 'REMOVE' ? goal?.currentAmount : MAX_GOAL_AMOUNT}
                        step="0.01"
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
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
