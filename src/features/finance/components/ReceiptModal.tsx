'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Download, FileText, Trash2, Upload } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { usePermission } from '@/features/workspaces';
import { notify, getErrorMessage } from '@/lib/ui/toast';
import { SETTINGS_BY_KEY } from '@/lib/settings/registry';
import type { ReceiptMetadata, Transaction } from '../types';
import { fetchReceiptFile, readFileAsBase64 } from '../api/receipt-api';
import { useDeleteReceipt, useUpdateReceiptNote, useUploadReceipt } from '../hooks/use-receipts';
import { RECEIPT_NOTE_MAX, isAllowedReceiptMime } from '../lib/receipt-validation';
import { LockedButton, useCapability } from '@/features/plans';
import { usePublicSettings } from '@/features/settings/hooks/use-settings';

type Props = {
    onClose: () => void;
    workspaceId: string;
    transaction: Transaction;
    receipt?: ReceiptMetadata;
};

function formatBytes(n: number) {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

// Mount with a `key` that changes when the receipt changes, so `note` re-initialises.
export function ReceiptModal({ onClose, workspaceId, transaction, receipt }: Props) {
    const canUpload = usePermission('receipt.upload');
    const canDelete = usePermission('receipt.delete');
    const { allowed: receiptsEnabled } = useCapability('receipts');
    const { data: publicSettings } = usePublicSettings();
    const maxBytes = Number(
        publicSettings?.['limits.receiptMaxBytes'] ??
            SETTINGS_BY_KEY['limits.receiptMaxBytes'].default,
    );

    const upload = useUploadReceipt(workspaceId);
    const saveNote = useUpdateReceiptNote(workspaceId);
    const remove = useDeleteReceipt(workspaceId);

    const [note, setNote] = useState(receipt?.note ?? '');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const txId = transaction.id;
    const mimeType = receipt?.mimeType;
    const version = receipt?.updatedAt;
    const isImage = Boolean(mimeType?.startsWith('image/'));

    useEffect(() => {
        if (!isImage) return;
        let cancelled = false;
        let url: string | null = null;
        fetchReceiptFile(workspaceId, txId)
            .then((blob) => {
                if (cancelled) return;
                url = URL.createObjectURL(blob);
                setPreviewUrl(url);
            })
            .catch(() => {});
        return () => {
            cancelled = true;
            if (url) URL.revokeObjectURL(url);
            setPreviewUrl(null);
        };
    }, [workspaceId, txId, isImage, version]);

    const busy = upload.isPending || saveNote.isPending || remove.isPending;

    const onPickFile = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        if (!isAllowedReceiptMime(file.type)) {
            notify.error('Only JPEG, PNG, WebP or PDF files are allowed');
            return;
        }
        if (file.size > maxBytes) {
            notify.error(`File is too large (max ${formatBytes(maxBytes)})`);
            return;
        }
        try {
            const data = await readFileAsBase64(file);
            upload.mutate(
                {
                    txId,
                    input: {
                        fileName: file.name,
                        mimeType: file.type,
                        size: file.size,
                        note: note.trim() || null,
                        data,
                    },
                },
                {
                    onSuccess: () =>
                        notify.success(receipt ? 'Receipt replaced' : 'Receipt uploaded'),
                    onError: (err) =>
                        notify.error(getErrorMessage(err, 'Failed to upload receipt')),
                },
            );
        } catch (err) {
            notify.error(getErrorMessage(err, 'Could not read the file'));
        }
    };

    const onDownload = async () => {
        if (!receipt) return;
        try {
            const blob = await fetchReceiptFile(workspaceId, txId, { download: true });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = receipt.fileName;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            notify.error(getErrorMessage(err, 'Failed to download receipt'));
        }
    };

    const onSaveNote = () =>
        saveNote.mutate(
            { txId, note },
            {
                onSuccess: () => notify.success('Note saved'),
                onError: (err) => notify.error(getErrorMessage(err, 'Failed to save note')),
            },
        );

    const onConfirmDelete = () =>
        remove.mutate(txId, {
            onSuccess: () => {
                setConfirmDelete(false);
                notify.success('Receipt deleted');
                onClose();
            },
            onError: (err) => notify.error(getErrorMessage(err, 'Failed to delete receipt')),
        });

    const noteChanged = note.trim() !== (receipt?.note ?? '');

    return (
        <>
            <Modal open={true} onClose={onClose} title="Receipt">
                <div className="space-y-4">
                    <p className="text-base-content/70 truncate text-sm">
                        {transaction.description || 'Untitled Transaction'}
                    </p>

                    {receipt ? (
                        <div className="space-y-3">
                            <div className="bg-base-200 flex min-h-40 items-center justify-center overflow-hidden rounded-lg p-2">
                                {isImage && previewUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={previewUrl}
                                        alt={receipt.fileName}
                                        className="max-h-80 w-auto rounded"
                                    />
                                ) : (
                                    <div className="text-base-content/60 flex flex-col items-center gap-2 py-6">
                                        <FileText className="h-10 w-10" />
                                        <span className="text-xs">{receipt.mimeType}</span>
                                    </div>
                                )}
                            </div>
                            <p className="text-base-content/60 text-xs">
                                {receipt.fileName} · {formatBytes(receipt.size)} · added{' '}
                                {new Date(receipt.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    ) : (
                        <div className="border-base-300 text-base-content/60 rounded-lg border border-dashed p-6 text-center text-sm">
                            No receipt attached
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-sm font-medium" htmlFor="receipt-note">
                            Note
                        </label>
                        <textarea
                            id="receipt-note"
                            className="textarea textarea-bordered w-full"
                            rows={3}
                            maxLength={RECEIPT_NOTE_MAX}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            disabled={!canUpload || busy}
                            placeholder="Optional plain-text note about this receipt"
                        />
                        <p className="text-base-content/50 text-right text-xs">
                            {note.length}/{RECEIPT_NOTE_MAX}
                        </p>
                    </div>

                    {canUpload && (
                        <>
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,application/pdf"
                                className="hidden"
                                onChange={onPickFile}
                            />
                            <LockedButton
                                variant="ghost"
                                size="sm"
                                locked={!receiptsEnabled}
                                lockedMessage="Receipt attachments aren't available on your plan."
                                onClick={() => fileRef.current?.click()}
                                disabled={busy}
                            >
                                <Upload className="mr-1 h-4 w-4" />
                                {receipt ? 'Replace file' : 'Attach file'}
                            </LockedButton>
                        </>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                        <div className="flex gap-2">
                            {receipt && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onDownload}
                                    disabled={busy}
                                >
                                    <Download className="mr-1 h-4 w-4" />
                                    Download
                                </Button>
                            )}
                            {receipt && canDelete && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setConfirmDelete(true)}
                                    disabled={busy}
                                >
                                    <Trash2 className="text-error mr-1 h-4 w-4" />
                                    <span className="text-error">Delete</span>
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {receipt && canUpload && (
                                <Button
                                    size="sm"
                                    onClick={onSaveNote}
                                    disabled={busy || !noteChanged}
                                >
                                    Save note
                                </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={onClose}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>

            {confirmDelete && (
                <ConfirmDialog
                    isOpen={true}
                    title="Delete receipt"
                    description="This removes the attached file and note. The transaction is not affected."
                    confirmText="Delete"
                    variant="danger"
                    onConfirm={onConfirmDelete}
                    onClose={() => setConfirmDelete(false)}
                    loading={remove.isPending}
                />
            )}
        </>
    );
}
