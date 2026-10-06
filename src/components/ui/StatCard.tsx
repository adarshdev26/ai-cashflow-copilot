import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export type StatTone = 'positive' | 'negative' | 'neutral';

const toneStyles: Record<StatTone, { icon: string; value: string }> = {
  positive: { icon: 'bg-success/10 text-success', value: 'text-success' },
  negative: { icon: 'bg-error/10 text-error', value: 'text-error' },
  neutral: { icon: 'bg-primary/10 text-primary', value: 'text-base-content' },
};

interface StatCardProps {
  title: string;
  /** Already formatted (currency, count, percentage...). The card doesn't format anything. */
  value: ReactNode;
  icon?: LucideIcon;
  tone?: StatTone;
  /** Small muted text under the value, e.g. "12 active · 3 inactive" or "Sep 2026". */
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
    <div
      className={`rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm transition-shadow hover:shadow-md ${className}`}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${styles.icon}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
        <p className="min-w-0 truncate text-sm font-medium text-base-content/60">{title}</p>
      </div>

      <div className="mt-4">
        <p className={`break-words text-2xl font-bold tracking-tight tabular-nums ${styles.value}`}>{value}</p>
        {caption && <p className="mt-1 text-xs text-base-content/50">{caption}</p>}
      </div>

      {footer && <div className="mt-4 border-t border-base-200 pt-3 text-xs text-base-content/60">{footer}</div>}
    </div>
  );
}

export function StatCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm ${className}`}>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 shrink-0 rounded-lg bg-base-200" />
        <div className="h-3 w-24 rounded bg-base-200" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-7 w-28 rounded bg-base-200" />
        <div className="h-3 w-36 rounded bg-base-200" />
      </div>
    </div>
  );
}