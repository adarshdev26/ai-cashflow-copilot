import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export type StatTone = 'positive' | 'negative' | 'neutral';

const toneStyles: Record<StatTone, { icon: string; value: string }> = {
  positive: { icon: 'bg-emerald-50 text-emerald-600', value: 'text-emerald-600' },
  negative: { icon: 'bg-rose-50 text-rose-600', value: 'text-rose-600' },
  neutral: { icon: 'bg-indigo-50 text-indigo-600', value: 'text-slate-900' },
};

interface StatCardProps {
  title: string;
  /** Already formatted (currency, count, percentage...). The card doesn't format anything. */
  value: ReactNode;
  icon?: LucideIcon;
  tone?: StatTone;
  /** Small muted text under the title, e.g. "Sep 2026". */
  caption?: string;
  /** Optional content under a divider, e.g. a breakdown. */
  footer?: ReactNode;
  className?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  tone = 'neutral',
  caption,
  footer,
  className = '',
}: StatCardProps) {
  const styles = toneStyles[tone];

  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          {caption && <p className="text-xs text-slate-400">{caption}</p>}
        </div>
        {Icon && (
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${styles.icon}`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <p className={`mt-3 truncate text-2xl font-semibold ${styles.value}`}>{value}</p>

      {footer && <div className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">{footer}</div>}
    </div>
  );
}

export function StatCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`h-[116px] animate-pulse rounded-xl border border-slate-200 bg-slate-50 ${className}`} />
  );
}