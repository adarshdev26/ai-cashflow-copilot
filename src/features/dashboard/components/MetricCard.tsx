import { LucideIcon } from 'lucide-react';
import { memo } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: string;
}

export const MetricCard = memo(function MetricCard({ title, value, description, icon: Icon }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-base-300 bg-base-100 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-base-content/60">{title}</span>
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 text-3xl font-bold tracking-tight text-base-content">{value}</div>
      {description && (
        <p className="mt-1 text-xs text-base-content/60">{description}</p>
      )}
    </div>
  );
})

export function MetricCardSkeleton() {
  return (
    <div className="rounded-xl border border-base-300 bg-base-100 p-6 shadow-sm animate-pulse" aria-hidden="true">
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 rounded bg-base-200" />
        <div className="h-9 w-9 rounded-lg bg-base-200" />
      </div>
      <div className="mt-4 h-8 w-32 rounded bg-base-200" />
      <div className="mt-2 h-3 w-40 rounded bg-base-200" />
    </div>
  );
}