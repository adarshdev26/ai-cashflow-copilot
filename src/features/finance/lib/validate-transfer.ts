export interface TransferInput {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    /** YYYY-MM-DD */
    date: string;
    note: string | null;
}

export type TransferValidation =
    { ok: true; data: Omit<TransferInput, 'date'> & { date: Date } } | { ok: false; error: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_NOTE = 255; // ⚠️ use the same limit as transaction description

export function validateTransfer(body: unknown): TransferValidation {
    const b = (body ?? {}) as Record<string, unknown>;

    const fromAccountId = typeof b.fromAccountId === 'string' ? b.fromAccountId : '';
    const toAccountId = typeof b.toAccountId === 'string' ? b.toAccountId : '';
    if (!fromAccountId) return { ok: false, error: 'Select the source account' };
    if (!toAccountId) return { ok: false, error: 'Select the destination account' };
    if (fromAccountId === toAccountId) {
        return { ok: false, error: 'Source and destination accounts must be different' };
    }

    const rawAmount = Number(b.amount);
    if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
        return { ok: false, error: 'Amount must be greater than 0' };
    }
    const amount = Math.round(rawAmount * 100) / 100;
    if (amount <= 0) return { ok: false, error: 'Amount must be greater than 0' };

    const dateStr = typeof b.date === 'string' ? b.date : '';
    if (!DATE_RE.test(dateStr)) return { ok: false, error: 'Enter a valid date' };
    const date = new Date(`${dateStr}T12:00:00.000Z`); // same "noon UTC" convention as transactions
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== dateStr)
        return { ok: false, error: 'Enter a valid date' };

    const note = typeof b.note === 'string' ? b.note.trim() : '';
    if (note.length > MAX_NOTE) {
        return { ok: false, error: `Note must be at most ${MAX_NOTE} characters` };
    }

    return {
        ok: true,
        data: { fromAccountId, toAccountId, amount, date, note: note || null },
    };
}
