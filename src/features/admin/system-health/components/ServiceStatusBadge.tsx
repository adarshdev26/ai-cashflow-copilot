import { AlertTriangle, CheckCircle2, HelpCircle, MinusCircle, XCircle } from 'lucide-react';
import type { ServiceHealthStatus } from '../types';

const STYLES: Record<
    ServiceHealthStatus,
    { label: string; className: string; Icon: typeof CheckCircle2 }
> = {
    healthy: {
        label: 'Healthy',
        className: 'border-success/30 bg-success/10 text-success',
        Icon: CheckCircle2,
    },
    degraded: {
        label: 'Degraded',
        className: 'border-warning/30 bg-warning/10 text-warning',
        Icon: AlertTriangle,
    },
    down: { label: 'Down', className: 'border-error/30 bg-error/10 text-error', Icon: XCircle },
    not_configured: {
        label: 'Not configured',
        className: 'border-base-300 bg-base-200 text-base-content/60',
        Icon: MinusCircle,
    },
    unknown: {
        label: 'Unknown',
        className: 'border-base-300 bg-base-200 text-base-content/60',
        Icon: HelpCircle,
    },
};

/** Icon + text, never colour alone. */
export function ServiceStatusBadge({ status }: { status: ServiceHealthStatus }) {
    const { label, className, Icon } = STYLES[status];
    return (
        <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${className}`}
        >
            <Icon className="h-3.5 w-3.5" />
            {label}
        </span>
    );
}
