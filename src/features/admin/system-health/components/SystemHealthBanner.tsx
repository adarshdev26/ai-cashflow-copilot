import { AlertTriangle, CheckCircle2, HelpCircle, XCircle } from 'lucide-react';
import type { ServiceStatus } from '../types';

export function SystemHealthBanner({ services }: { services: ServiceStatus[] }) {
    const down = services.filter((s) => s.status === 'down').length;
    const degraded = services.filter((s) => s.status === 'degraded').length;
    const unknown = services.filter((s) => s.status === 'unknown').length;

    const view =
        down > 0
            ? {
                  text: `${down} service${down === 1 ? '' : 's'} down`,
                  className: 'border-error/30 bg-error/10 text-error',
                  Icon: XCircle,
              }
            : degraded > 0
              ? {
                    text: `${degraded} service${degraded === 1 ? '' : 's'} degraded`,
                    className: 'border-warning/30 bg-warning/10 text-warning',
                    Icon: AlertTriangle,
                }
              : unknown > 0
                ? {
                      text: 'Some checks could not run',
                      className: 'border-base-300 bg-base-200 text-base-content/70',
                      Icon: HelpCircle,
                  }
                : {
                      text: 'All systems operational',
                      className: 'border-success/30 bg-success/10 text-success',
                      Icon: CheckCircle2,
                  };

    return (
        <div
            role="status"
            className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${view.className}`}
        >
            <view.Icon className="h-4 w-4 shrink-0" />
            {view.text}
        </div>
    );
}
