import { Clock, Database, Server, ShieldCheck, type LucideIcon } from 'lucide-react';
import { formatAuditDateTime } from '../../audit-logs/utils';
import type { ServiceId, ServiceStatus } from '../types';
import { ServiceStatusBadge } from './ServiceStatusBadge';
import { ServiceInfoPanel } from './ServiceInfoPanel';

const ICONS: Record<ServiceId, LucideIcon> = {
    api: Server,
    database: Database,
    auth: ShieldCheck,
    cron: Clock,
};

export function ServiceStatusCard({ service }: { service: ServiceStatus }) {
    const Icon = ICONS[service.id];
    return (
        <div className="border-base-300 bg-base-100 flex h-full flex-col rounded-xl border p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                        <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-base-content min-w-0 truncate text-sm font-semibold">
                        {service.name}
                    </p>
                </div>
                <ServiceStatusBadge status={service.status} />
            </div>
            <p className="text-base-content/70 mt-4 text-sm">{service.detail}</p>
            <p className="text-base-content/50 mt-1 text-xs">
                Checked {formatAuditDateTime(service.checkedAt)}
                {service.lastIncidentAt
                    ? ` · last server error ${formatAuditDateTime(service.lastIncidentAt)}`
                    : ''}
            </p>
            {/* mt-auto pushes the panel to the bottom so every card lines up */}
            <div className="mt-auto">
                <ServiceInfoPanel info={service.info} />
            </div>
        </div>
    );
}
