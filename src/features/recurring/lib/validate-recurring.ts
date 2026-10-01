import { toScheduleDate, type RecurringFrequency } from '@/lib/recurring-dates';
import { getAccountError } from "@/features/accounts/lib/check-account";
import { getCategoryError } from '@/lib/categories';

const MAX_AMOUNT = 1_000_000_000;
const MAX_DESC = 255;
const FREQS: RecurringFrequency[] = ['WEEKLY', 'MONTHLY', 'YEARLY'];

export interface ValidData {
    accountId?: string;
    categoryId?: string | null;
    description?: string | null;
    amount?: number;
    type?: 'CREDIT' | 'DEBIT';
    frequency?: RecurringFrequency;
    startDate?: Date;
    endDate?: Date | null;
    isActive?: boolean;
}
type Result = { ok: true; data: ValidData } | { ok: false; error: string };

export function validateRecurringInput(input: unknown, opts: { partial: boolean }): Result {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        return { ok: false, error: 'Invalid body' };
    }
    const body = input as Record<string, unknown>;
    const p = opts.partial;
    const d: ValidData = {};
    const has = (k: string) => body[k] !== undefined;

    if (!p || has('amount')) {
        const n = Number(body.amount);
        if (!Number.isFinite(n) || n <= 0) return { ok: false, error: 'Amount must be a positive number' };
        if (n > MAX_AMOUNT) return { ok: false, error: 'Amount is too large' };
        d.amount = Math.round(n * 100) / 100;
        if (d.amount <= 0) return { ok: false, error: 'Amount must be at least 0.01' };
    }
    if (!p || has('type')) {
        if (body.type !== 'CREDIT' && body.type !== 'DEBIT') return { ok: false, error: 'Invalid type' };
        d.type = body.type as 'CREDIT' | 'DEBIT';
    }
    if (!p || has('frequency')) {
        if (!FREQS.includes(body.frequency as RecurringFrequency)) return { ok: false, error: 'Invalid frequency' };
        d.frequency = body.frequency as RecurringFrequency;
    }
    if (has('description')) {
        if (body.description === null) d.description = null;
        else if (typeof body.description !== 'string') return { ok: false, error: 'Invalid description' };
        else {
            const t = body.description.trim();
            if (t.length > MAX_DESC) return { ok: false, error: `Description must be ${MAX_DESC} characters or fewer` };
            d.description = t || null;
        }
    } else if (!p) d.description = null;

    if (!p || has('accountId')) {
        if (typeof body.accountId !== 'string' || !body.accountId) return { ok: false, error: 'Account is required' };
        d.accountId = body.accountId;
    }
    if (has('categoryId')) {
        if (body.categoryId !== null && typeof body.categoryId !== 'string') return { ok: false, error: 'Invalid category' };
        d.categoryId = (body.categoryId as string | null) || null;
    } else if (!p) d.categoryId = null;

    try {
        if (!p || has('startDate')) d.startDate = toScheduleDate(body.startDate as string);
        if (has('endDate')) d.endDate = body.endDate ? toScheduleDate(body.endDate as string) : null;
    } catch {
        return { ok: false, error: 'Invalid date (use YYYY-MM-DD)' };
    }
    if (d.startDate && d.endDate && d.endDate < d.startDate) {
        return { ok: false, error: 'End date must be on or after start date' };
    }
    if (has('isActive')) {
        if (typeof body.isActive !== 'boolean') return { ok: false, error: 'Invalid isActive' };
        d.isActive = body.isActive;
    }
    return { ok: true, data: d };
}

/** Returns an error string or null. Works with no request context. */
export async function checkTargets(
    workspaceId: string, accountId: string, categoryId: string | null, type: 'CREDIT' | 'DEBIT',
): Promise<string | null> {
    const a = await getAccountError(workspaceId, accountId, { requireActive: true });
    if (a) return a;
    if (categoryId) return getCategoryError(categoryId, workspaceId, { type, requireActive: true });
    return null;
}