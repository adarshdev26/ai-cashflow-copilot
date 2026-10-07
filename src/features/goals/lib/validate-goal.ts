import { toScheduleDate } from '@/lib/recurring/recurring-dates';
import type { ContributionInput, GoalInput } from '../types';

export const MAX_GOAL_AMOUNT = 1_000_000_000;
const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 1000;

function record(value: unknown): Record<string, unknown> | null {
    return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

function positiveAmount(value: unknown, label: string): ValidationResult<number> {
    const amount =
        typeof value === 'number'
            ? value
            : typeof value === 'string' && value.trim()
              ? Number(value)
              : Number.NaN;
    if (!Number.isFinite(amount) || amount <= 0) {
        return { ok: false, error: `${label} must be greater than 0` };
    }
    if (amount > MAX_GOAL_AMOUNT) return { ok: false, error: `${label} is too large` };
    return { ok: true, value: Math.round(amount * 100) / 100 };
}

function dateOnly(value: unknown): ValidationResult<string> {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return { ok: false, error: 'Target date must be in YYYY-MM-DD format' };
    }
    try {
        toScheduleDate(value);
        return { ok: true, value };
    } catch {
        return { ok: false, error: 'Target date is invalid' };
    }
}

export function validateGoalInput(value: unknown): ValidationResult<GoalInput> {
    const body = record(value);
    if (!body) return { ok: false, error: 'Invalid goal data' };
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) return { ok: false, error: 'Name is required' };
    if (name.length > MAX_NAME_LENGTH) {
        return { ok: false, error: `Name must be at most ${MAX_NAME_LENGTH} characters` };
    }
    if (body.description != null && typeof body.description !== 'string') {
        return { ok: false, error: 'Description must be text' };
    }
    const description = typeof body.description === 'string' ? body.description.trim() : null;
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
        return {
            ok: false,
            error: `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters`,
        };
    }
    const targetAmount = positiveAmount(body.targetAmount, 'Target amount');
    if (!targetAmount.ok) return targetAmount;
    const targetDate = dateOnly(body.targetDate);
    if (!targetDate.ok) return targetDate;
    return {
        ok: true,
        value: {
            name,
            targetAmount: targetAmount.value,
            targetDate: targetDate.value,
            description: description || null,
        },
    };
}

export function validateGoalContribution(value: unknown): ValidationResult<ContributionInput> {
    const body = record(value);
    if (!body) return { ok: false, error: 'Invalid contribution data' };
    if (body.kind !== 'ADD' && body.kind !== 'REMOVE') {
        return { ok: false, error: 'Kind must be ADD or REMOVE' };
    }
    const amount = positiveAmount(body.amount, 'Amount');
    if (!amount.ok) return amount;
    return { ok: true, value: { kind: body.kind, amount: amount.value } };
}
