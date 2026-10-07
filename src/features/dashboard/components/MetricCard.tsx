import { LucideIcon } from 'lucide-react';
import { memo, type ReactNode } from 'react';

interface MetricCardProps {
    title: string;
    value: string | number;
    description?: ReactNode;
    icon: LucideIcon;
    trend?: string;
}

export const MetricCard = memo(function MetricCard({
    title,
    value,
    description,
    icon: Icon,
}: MetricCardProps) {
    return (
        <div className="border-base-300 bg-base-100 rounded-xl border p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
                <span className="text-base-content/60 text-sm font-medium">{title}</span>
                <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-lg">
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            <div className="text-base-content mt-4 text-3xl font-bold tracking-tight">{value}</div>
            {description && <p className="text-base-content/60 mt-1 text-xs">{description}</p>}
        </div>
    );
});

export function MetricCardSkeleton() {
    return (
        <div
            className="border-base-300 bg-base-100 animate-pulse rounded-xl border p-6 shadow-sm"
            aria-hidden="true"
        >
            <div className="flex items-center justify-between">
                <div className="bg-base-200 h-4 w-24 rounded" />
                <div className="bg-base-200 h-9 w-9 rounded-lg" />
            </div>
            <div className="bg-base-200 mt-4 h-8 w-32 rounded" />
            <div className="bg-base-200 mt-2 h-3 w-40 rounded" />
        </div>
    );
}
