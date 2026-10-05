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
    <div className={`rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-base-content/60">{title}</p>
          {caption && <p className="text-xs text-base-content/50">{caption}</p>}
        </div>
        {Icon && (
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${styles.icon}`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <p className={`mt-3 break-words text-lg font-semibold tabular-nums sm:text-2xl ${styles.value}`}>{value}</p>

      {footer && <div className="mt-3 border-t border-base-200 pt-3 text-xs text-base-content/60">{footer}</div>}
    </div>
  );
}

export function StatCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`h-[116px] animate-pulse rounded-xl border border-base-300 bg-base-200 ${className}`} />
  );
}