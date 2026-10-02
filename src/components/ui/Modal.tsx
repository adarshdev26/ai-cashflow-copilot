'use client';

import { useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/cn';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  closeOnBackdrop?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) {
        dialog.showModal();
        document.body.style.overflow = 'hidden';
      }
    } else {
      if (dialog.open) {
        dialog.close();
        document.body.style.overflow = '';
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onClose]);

  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDialogElement>) => {
    if (!closeOnBackdrop) return;
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [closeOnBackdrop, onClose]);

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className={cn(
        "backdrop:bg-black/40 backdrop:backdrop-blur-sm",
        "fixed inset-0 m-auto h-fit max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto",
        "rounded-xl border border-base-300 bg-base-100 p-0 shadow-xl",
        "animate-in fade-in zoom-in-95 duration-200",
        sizeClasses[size]
      )}
      aria-labelledby="modal-title"
    >
      <div className="p-6 space-y-4">
        <div>
          <h3 id="modal-title" className="text-lg font-semibold text-base-content">{title}</h3>
          {description && <p className="mt-1 text-sm text-base-content/60">{description}</p>}
        </div>

        <div>{children}</div>

        {footer && (
          <div className="flex justify-end gap-3 pt-2">
            {footer}
          </div>
        )}
      </div>
    </dialog>
  );
}
