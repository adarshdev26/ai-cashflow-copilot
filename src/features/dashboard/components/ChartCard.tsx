import { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  description?: string;
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  action?: ReactNode;
  children?: ReactNode;
}

export function ChartCard({
  title,
  description,
  isLoading = false,
  isError = false,
  isEmpty = false,
  emptyMessage = 'No data yet.',
  action,
  children,
}: ChartCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {description && <p className="text-xs text-slate-500">{description}</p>}
        </div>
        {action}
      </div>

      {/* Fixed height: ResponsiveContainer needs a parent with a real height */}
      <div className="h-72">
        {isLoading ? (
          <div className="h-full animate-pulse rounded-lg bg-slate-50" aria-hidden="true" />
        ) : isError ? (
          <div className="flex h-full items-center justify-center text-sm text-red-600">
            Couldn&apos;t load this chart.
          </div>
        ) : isEmpty ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">{emptyMessage}</div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}