import type { NoteCategory, NotePriority } from '../types';

export const NOTE_CATEGORIES: readonly NoteCategory[] = [
    'GENERAL',
    'BUDGET',
    'INVESTMENT',
    'TAX',
    'EXPENSE',
];

export const NOTE_PRIORITIES: readonly NotePriority[] = ['LOW', 'MEDIUM', 'HIGH'];

export const MAX_NOTE_TITLE_LENGTH = 200;
export const MAX_NOTE_CONTENT_LENGTH = 10000;
export const MAX_NOTE_AMOUNT = 1_000_000_000;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

export type ValidationResult<T> = { ok: true; data: T } | { ok: false; error: string };

function parseAmount(value: unknown): ValidationResult<number | null> {
    if (value === null || value === undefined || value === '') {
        return { ok: true, data: null };
    }
    const num =
        typeof value === 'number'
            ? value
            : typeof value === 'string' && value.trim() !== ''
              ? Number(value)
              : Number.NaN;

    if (!Number.isFinite(num)) {
        return { ok: false, error: 'Amount must be a valid number' };
    }
    if (num < 0) {
        return { ok: false, error: 'Amount cannot be negative' };
    }
    if (num > MAX_NOTE_AMOUNT) {
        return { ok: false, error: 'Amount is too large' };
    }
    return { ok: true, data: Math.round(num * 100) / 100 };
}

export interface ValidatedCreateNote {
    title: string;
    content: string;
    category: NoteCategory;
    priority: NotePriority;
    amount: number | null;
    isPinned: boolean;
}

export function validateCreateNote(input: unknown): ValidationResult<ValidatedCreateNote> {
    if (!isRecord(input)) {
        return { ok: false, error: 'Invalid note data' };
    }

    const title = typeof input.title === 'string' ? input.title.trim() : '';
    if (!title) {
        return { ok: false, error: 'Title is required' };
    }
    if (title.length > MAX_NOTE_TITLE_LENGTH) {
        return {
            ok: false,
            error: `Title must be at most ${MAX_NOTE_TITLE_LENGTH} characters`,
        };
    }

    const content = typeof input.content === 'string' ? input.content.trim() : '';
    if (!content) {
        return { ok: false, error: 'Content is required' };
    }
    if (content.length > MAX_NOTE_CONTENT_LENGTH) {
        return {
            ok: false,
            error: `Content must be at most ${MAX_NOTE_CONTENT_LENGTH} characters`,
        };
    }

    let category: NoteCategory = 'GENERAL';
    if (input.category !== undefined && input.category !== null) {
        if (
            typeof input.category !== 'string' ||
            !NOTE_CATEGORIES.includes(input.category as NoteCategory)
        ) {
            return {
                ok: false,
                error: `Category must be one of: ${NOTE_CATEGORIES.join(', ')}`,
            };
        }
        category = input.category as NoteCategory;
    }

    let priority: NotePriority = 'MEDIUM';
    if (input.priority !== undefined && input.priority !== null) {
        if (
            typeof input.priority !== 'string' ||
            !NOTE_PRIORITIES.includes(input.priority as NotePriority)
        ) {
            return {
                ok: false,
                error: `Priority must be one of: ${NOTE_PRIORITIES.join(', ')}`,
            };
        }
        priority = input.priority as NotePriority;
    }

    let isPinned = false;
    if (input.isPinned !== undefined && input.isPinned !== null) {
        if (typeof input.isPinned !== 'boolean') {
            return { ok: false, error: 'isPinned must be a boolean' };
        }
        isPinned = input.isPinned;
    }

    const amountResult = parseAmount(input.amount);
    if (!amountResult.ok) return amountResult;

    return {
        ok: true,
        data: {
            title,
            content,
            category,
            priority,
            amount: amountResult.data,
            isPinned,
        },
    };
}

export interface ValidatedUpdateNote {
    title?: string;
    content?: string;
    category?: NoteCategory;
    priority?: NotePriority;
    amount?: number | null;
    isCompleted?: boolean;
    isPinned?: boolean;
}

export function validateUpdateNote(input: unknown): ValidationResult<ValidatedUpdateNote> {
    if (!isRecord(input)) {
        return { ok: false, error: 'Invalid note data' };
    }

    const data: ValidatedUpdateNote = {};

    if (input.title !== undefined) {
        if (typeof input.title !== 'string') {
            return { ok: false, error: 'Title must be text' };
        }
        const trimmed = input.title.trim();
        if (!trimmed) {
            return { ok: false, error: 'Title cannot be empty' };
        }
        if (trimmed.length > MAX_NOTE_TITLE_LENGTH) {
            return {
                ok: false,
                error: `Title must be at most ${MAX_NOTE_TITLE_LENGTH} characters`,
            };
        }
        data.title = trimmed;
    }

    if (input.content !== undefined) {
        if (typeof input.content !== 'string') {
            return { ok: false, error: 'Content must be text' };
        }
        const trimmed = input.content.trim();
        if (!trimmed) {
            return { ok: false, error: 'Content cannot be empty' };
        }
        if (trimmed.length > MAX_NOTE_CONTENT_LENGTH) {
            return {
                ok: false,
                error: `Content must be at most ${MAX_NOTE_CONTENT_LENGTH} characters`,
            };
        }
        data.content = trimmed;
    }

    if (input.category !== undefined) {
        if (
            typeof input.category !== 'string' ||
            !NOTE_CATEGORIES.includes(input.category as NoteCategory)
        ) {
            return {
                ok: false,
                error: `Category must be one of: ${NOTE_CATEGORIES.join(', ')}`,
            };
        }
        data.category = input.category as NoteCategory;
    }

    if (input.priority !== undefined) {
        if (
            typeof input.priority !== 'string' ||
            !NOTE_PRIORITIES.includes(input.priority as NotePriority)
        ) {
            return {
                ok: false,
                error: `Priority must be one of: ${NOTE_PRIORITIES.join(', ')}`,
            };
        }
        data.priority = input.priority as NotePriority;
    }

    if (input.amount !== undefined) {
        const amountResult = parseAmount(input.amount);
        if (!amountResult.ok) return amountResult;
        data.amount = amountResult.data;
    }

    if (input.isCompleted !== undefined) {
        if (typeof input.isCompleted !== 'boolean') {
            return { ok: false, error: 'isCompleted must be a boolean' };
        }
        data.isCompleted = input.isCompleted;
    }

    if (input.isPinned !== undefined) {
        if (typeof input.isPinned !== 'boolean') {
            return { ok: false, error: 'isPinned must be a boolean' };
        }
        data.isPinned = input.isPinned;
    }

    if (Object.keys(data).length === 0) {
        return { ok: false, error: 'No fields provided to update' };
    }

    return { ok: true, data };
}
