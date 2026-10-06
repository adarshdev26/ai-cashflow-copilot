import Papa from 'papaparse';

export const CSV_COLUMNS = [
    'Date',
    'Type',
    'Amount',
    'Description',
    'Category',
    'Financial Account',
] as const;
export const MAX_IMPORT_ROWS = 5000;
export const MAX_IMPORT_CHARS = 5 * 1024 * 1024;

export type ParsedCsvRow = {
    row: number; // spreadsheet row number (header is row 1)
    date: string; // ISO string
    type: 'CREDIT' | 'DEBIT';
    amount: number;
    description: string | null;
    category: string | null;
    account: string | null; // name or id, resolved on the server
};

export type CsvRowError = { row: number; message: string };

export function parseTransactionCsv(
    text: string,
    maxRows = MAX_IMPORT_ROWS,
): { rows: ParsedCsvRow[]; errors: CsvRowError[] } {
    const parsed = Papa.parse<Record<string, string>>(text.replace(/^\uFEFF/, ''), {
        header: true,
        skipEmptyLines: 'greedy',
        transformHeader: (h) => h.trim().toLowerCase(),
    });

    const errors: CsvRowError[] = [];
    const rows: ParsedCsvRow[] = [];

    const headers = parsed.meta.fields ?? [];
    const missing = ['date', 'type', 'amount'].filter((h) => !headers.includes(h));
    if (missing.length) {
        return {
            rows,
            errors: [{ row: 1, message: `Missing required column(s): ${missing.join(', ')}` }],
        };
    }
    if (parsed.data.length > maxRows) {
        return { rows, errors: [{ row: 1, message: `Too many rows (max ${maxRows})` }] };
    }

    parsed.data.forEach((raw, i) => {
        const row = i + 2;
        const date = new Date((raw['date'] ?? '').trim());
        const type = (raw['type'] ?? '').trim().toUpperCase();
        const amount = Number((raw['amount'] ?? '').trim());
        const description = (raw['description'] ?? '').trim();

        if (Number.isNaN(date.getTime())) {
            errors.push({ row, message: 'Invalid Date (use e.g. 2026-09-30T09:15:00.000Z)' });
            return;
        }
        if (type !== 'CREDIT' && type !== 'DEBIT') {
            errors.push({ row, message: 'Type must be CREDIT or DEBIT' });
            return;
        }
        if (!Number.isFinite(amount) || amount <= 0) {
            errors.push({ row, message: 'Amount must be a positive number' });
            return;
        }
        if (description.length > 255) {
            errors.push({ row, message: 'Description is longer than 255 characters' });
            return;
        }

        rows.push({
            row,
            date: date.toISOString(),
            type,
            amount: Math.round(amount * 100) / 100,
            description: description || null,
            category: (raw['category'] ?? '').trim() || null,
            account: (raw['financial account'] ?? '').trim() || null,
        });
    });

    return { rows, errors };
}
