export const RECEIPT_ALLOWED_MIME = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
] as const;
export type ReceiptMime = (typeof RECEIPT_ALLOWED_MIME)[number];

export const RECEIPT_NOTE_MAX = 255;
export const RECEIPT_FILENAME_MAX = 255;

export const isAllowedReceiptMime = (v: unknown): v is ReceiptMime =>
    typeof v === 'string' && (RECEIPT_ALLOWED_MIME as readonly string[]).includes(v);

/** Never select `data` in list/metadata queries. */
export const RECEIPT_METADATA_SELECT = {
    id: true,
    transactionId: true,
    fileName: true,
    mimeType: true,
    size: true,
    note: true,
    createdAt: true,
    updatedAt: true,
} as const;

export function normalizeReceiptNote(
    value: unknown,
): { ok: true; value: string | null } | { ok: false; error: string } {
    if (value === undefined || value === null) return { ok: true, value: null };
    if (typeof value !== 'string') return { ok: false, error: 'note must be a string' };
    const trimmed = value.trim();
    if (trimmed.length > RECEIPT_NOTE_MAX) {
        return { ok: false, error: `Note must be ${RECEIPT_NOTE_MAX} characters or fewer` };
    }
    return { ok: true, value: trimmed || null };
}

export function sanitizeFileName(name: string): string {
    const cleaned = name.replace(/[\\/\r\n"]/g, '_').trim().slice(0, RECEIPT_FILENAME_MAX);
    return cleaned || 'receipt';
}

const startsWith = (b: Uint8Array, sig: number[], offset = 0) =>
    b.length >= offset + sig.length && sig.every((s, i) => b[offset + i] === s);

/** Checks the file's real signature, since the declared mime is untrusted. */
export function matchesMagicBytes(mime: ReceiptMime, b: Uint8Array): boolean {
    switch (mime) {
        case 'image/jpeg':
            return startsWith(b, [0xff, 0xd8, 0xff]);
        case 'image/png':
            return startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
        case 'image/webp':
            return startsWith(b, [0x52, 0x49, 0x46, 0x46]) && startsWith(b, [0x57, 0x45, 0x42, 0x50], 8);
        case 'application/pdf':
            return startsWith(b, [0x25, 0x50, 0x44, 0x46]);
    }
}