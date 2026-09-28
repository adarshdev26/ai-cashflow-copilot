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
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{title}</span>
        <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 text-3xl font-bold tracking-tight text-slate-900">{value}</div>
      {description && (
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      )}
    </div>
  );
})

export function MetricCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse" aria-hidden="true">
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 rounded bg-slate-100" />
        <div className="h-9 w-9 rounded-lg bg-slate-100" />
      </div>
      <div className="mt-4 h-8 w-32 rounded bg-slate-100" />
      <div className="mt-2 h-3 w-40 rounded bg-slate-100" />
    </div>
  );
}