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
        <div className="absolute right-0 z-20 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-lg">
          <div className="max-h-72 overflow-y-auto">
            {isLoading ? (
              <p className="p-4 text-sm text-base-content/60">Loading templates...</p>
            ) : isError ? (
              <p className="p-4 text-sm text-error">Failed to load templates.</p>
            ) : items.length === 0 ? (
              <div className="p-4 text-sm text-base-content/60">
                <p>No templates yet.</p>
                <Link
                  href="/dashboard/templates"
                  className="mt-1 inline-block font-medium text-primary hover:text-primary"
                  onClick={() => setOpen(false)}
                >
                  Create your first template
                </Link>
              </div>
            ) : (
              items.map((t) => {
                const needsAttention =
                  (t.account && !t.account.isActive) || t.category?.isActive === false;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onSelect(t);
                    }}
                    className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-base-200"
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium text-base-content">{t.name}</span>
                        {needsAttention && (
                          <span title="Its account or category is inactive. You will pick another.">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-warning" />
                          </span>
                        )}
                      </span>
                      <span className="block truncate text-xs text-base-content/60">
                        {t.type === 'CREDIT' ? 'Income' : 'Expense'}
                        {t.account ? ` · ${t.account.name}` : ''}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 text-xs font-semibold ${
                        t.amount == null
                          ? 'italic text-base-content/50'
                          : t.type === 'CREDIT'
                            ? 'text-success'
                            : 'text-base-content'
                      }`}
                    >
                      {t.amount == null ? 'Ask each time' : formatINR(t.amount, locale)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
          <div className="border-t border-base-200 bg-base-200/50 px-4 py-2">
            <Link
              href="/dashboard/templates"
              className="text-xs font-medium text-base-content/70 hover:text-base-content"
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
