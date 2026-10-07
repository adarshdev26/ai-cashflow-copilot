'use client';

import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'primary';
    onConfirm: () => void;
    onClose: () => void;
    loading?: boolean;
    error?: string;
}

export function ConfirmDialog({
    isOpen,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'primary',
    onConfirm,
    onClose,
    loading = false,
    error,
}: ConfirmDialogProps) {
    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            title={title}
            description={description}
            closeOnBackdrop={!loading}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                        {cancelText}
                    </Button>
                    <Button variant={variant} onClick={onConfirm} loading={loading}>
                        {confirmText}
                    </Button>
                </>
            }
        >
            {error && (
                <div className="border-error/30 bg-error/10 text-error mt-2 rounded-lg border p-3 text-sm">
                    {error}
                </div>
            )}
        </Modal>
    );
}
