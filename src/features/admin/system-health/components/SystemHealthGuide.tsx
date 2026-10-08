import { ChevronDown, HelpCircle } from 'lucide-react';
import type { HealthGuide } from '../types';
import { ServiceStatusBadge } from './ServiceStatusBadge';

/** Collapsible "How to read this page" box. All text comes from the backend (guide.ts). */
export function SystemHealthGuide({ guide }: { guide: HealthGuide }) {
    return (
        <details className="group border-base-300 bg-base-100 rounded-xl border p-5 shadow-sm">
            <summary className="text-base-content flex cursor-pointer list-none items-center gap-2 text-sm font-semibold select-none [&::-webkit-details-marker]:hidden">
                <HelpCircle className="text-primary h-4 w-4" />
                How to read this page
                <ChevronDown className="text-base-content/50 ml-auto h-4 w-4 transition-transform group-open:rotate-180" />
            </summary>

            <div className="text-base-content/70 mt-4 space-y-5 text-sm">
                <div>
                    <p className="text-base-content font-medium">How it works</p>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                        {guide.howItWorks.map((line) => (
                            <li key={line}>{line}</li>
                        ))}
                    </ul>
                </div>

                <div>
                    <p className="text-base-content font-medium">What the colours mean</p>
                    <ul className="mt-2 space-y-2">
                        {guide.statuses.map((s) => (
                            <li key={s.status} className="flex flex-wrap items-center gap-2">
                                <ServiceStatusBadge status={s.status} />
                                <span>{s.meaning}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <p className="text-base-content font-medium">What the error codes mean</p>
                    <ul className="mt-1 space-y-1">
                        {guide.errorCodes.map((c) => (
                            <li key={c.code}>
                                <span className="text-base-content font-mono text-xs">
                                    {c.code}
                                </span>{' '}
                                : {c.meaning}
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <p className="text-base-content font-medium">Good to know</p>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                        {guide.limits.map((line) => (
                            <li key={line}>{line}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </details>
    );
}
