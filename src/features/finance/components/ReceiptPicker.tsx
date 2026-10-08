'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { X } from 'lucide-react';
import { notify } from '@/lib/ui/toast';
import { SETTINGS_BY_KEY } from '@/lib/settings/registry';
import { usePublicSettings } from '@/features/settings/hooks/use-settings';
import { isAllowedReceiptMime } from '../lib/receipt-validation';

interface ReceiptPickerProps {
    file: File | null;
    onChange: (file: File | null) => void;
    disabled?: boolean;
}

function formatBytes(n: number) {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function ReceiptPicker({ file, onChange, disabled }: ReceiptPickerProps) {
    const { data: publicSettings } = usePublicSettings();
    const maxBytes = Number(
        publicSettings?.['limits.receiptMaxBytes'] ??
            SETTINGS_BY_KEY['limits.receiptMaxBytes'].default,
    );

    // Preview URL is created in event handlers (never in an effect), and revoked on
    // replace / remove / unmount.
    const [preview, setPreview] = useState<string | null>(null);
    const previewRef = useRef<string | null>(null);

    useEffect(() => {
        return () => {
            if (previewRef.current) URL.revokeObjectURL(previewRef.current);
        };
    }, []);

    const updatePreview = (next: File | null) => {
        if (previewRef.current) URL.revokeObjectURL(previewRef.current);
        const url = next && next.type.startsWith('image/') ? URL.createObjectURL(next) : null;
        previewRef.current = url;
        setPreview(url);
    };

    const handlePick = (e: ChangeEvent<HTMLInputElement>) => {
        const picked = e.target.files?.[0] ?? null;
        e.target.value = '';
        if (!picked) return;
        if (!isAllowedReceiptMime(picked.type)) {
            notify.error('Only JPEG, PNG, WebP or PDF files are allowed');
            return;
        }
        if (picked.size > maxBytes) {
            notify.error(`File is too large (max ${formatBytes(maxBytes)})`);
            return;
        }
        updatePreview(picked);
        onChange(picked);
    };

    const handleRemove = () => {
        updatePreview(null);
        onChange(null);
    };

    return (
        <div>
            <label className="text-base-content/80 mb-1 block text-xs font-medium">
                Receipt (optional)
            </label>
            {file ? (
                <div className="border-base-300 flex items-center gap-3 rounded-lg border p-2">
                    {preview && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={preview}
                            alt="Receipt preview"
                            className="h-12 w-12 rounded object-cover"
                        />
                    )}
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">{file.name}</p>
                        <p className="text-base-content/50 text-xs">{formatBytes(file.size)}</p>
                    </div>
                    <button
                        type="button"
                        onClick={handleRemove}
                        disabled={disabled}
                        aria-label="Remove receipt"
                        className="text-base-content/60 hover:text-error disabled:opacity-40"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ) : (
                <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handlePick}
                    disabled={disabled}
                    className="file-input file-input-bordered w-full"
                />
            )}
            <p className="text-base-content/50 mt-1 text-xs">Uploaded only when you save.</p>
        </div>
    );
}
