'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatINR } from '@/features/budgets/utils';
import { useTransactionTemplates } from '../hooks/use-transaction-templates';
import type { TransactionTemplateDTO } from '../types';
import { useUserLocale } from '@/features/settings/hooks/use-settings';

type Props = { onSelect: (template: TransactionTemplateDTO) => void };

export function UseTemplateMenu({ onSelect }: Props) {
    const locale = useUserLocale();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const { data, isLoading, isError } = useTransactionTemplates();
    const items = data ?? [];

    // Close on outside click or Escape.
    useEffect(() => {
        if (!open) return;
        const onPointerDown = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    return (
        <div ref={ref} className="relative">
            <Button
                data-tour="use-template-btn"
                variant="secondary"
                onClick={() => setOpen((o) => !o)}
                leftIcon={<LayoutTemplate className="h-4 w-4" />}
            >
                Use template
            </Button>

            {open && (
                <div className="border-base-300 bg-base-100 absolute right-0 z-20 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-xl border shadow-lg">
                    <div className="max-h-72 overflow-y-auto">
                        {isLoading ? (
                            <p className="text-base-content/60 p-4 text-sm">Loading templates...</p>
                        ) : isError ? (
                            <p className="text-error p-4 text-sm">Failed to load templates.</p>
                        ) : items.length === 0 ? (
                            <div className="text-base-content/60 p-4 text-sm">
                                <p>No templates yet.</p>
                                <Link
                                    href="/dashboard/templates"
                                    className="text-primary hover:text-primary mt-1 inline-block font-medium"
                                    onClick={() => setOpen(false)}
                                >
                                    Create your first template
                                </Link>
                            </div>
                        ) : (
                            items.map((t) => {
                                const needsAttention =
                                    (t.account && !t.account.isActive) ||
                                    t.category?.isActive === false;
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => {
                                            setOpen(false);
                                            onSelect(t);
                                        }}
                                        className="hover:bg-base-200 flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors"
                                    >
                                        <span className="min-w-0">
                                            <span className="flex items-center gap-1.5">
                                                <span className="text-base-content truncate text-sm font-medium">
                                                    {t.name}
                                                </span>
                                                {needsAttention && (
                                                    <span title="Its account or category is inactive. You will pick another.">
                                                        <AlertTriangle className="text-warning h-3.5 w-3.5 shrink-0" />
                                                    </span>
                                                )}
                                            </span>
                                            <span className="text-base-content/60 block truncate text-xs">
                                                {t.type === 'CREDIT' ? 'Income' : 'Expense'}
                                                {t.account ? ` · ${t.account.name}` : ''}
                                            </span>
                                        </span>
                                        <span
                                            className={`shrink-0 text-xs font-semibold ${
                                                t.amount == null
                                                    ? 'text-base-content/50 italic'
                                                    : t.type === 'CREDIT'
                                                      ? 'text-success'
                                                      : 'text-base-content'
                                            }`}
                                        >
                                            {t.amount == null
                                                ? 'Ask each time'
                                                : formatINR(t.amount, locale)}
                                        </span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                    <div className="border-base-200 bg-base-200/50 border-t px-4 py-2">
                        <Link
                            href="/dashboard/templates"
                            className="text-base-content/70 hover:text-base-content text-xs font-medium"
                            onClick={() => setOpen(false)}
                        >
                            Manage templates
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
