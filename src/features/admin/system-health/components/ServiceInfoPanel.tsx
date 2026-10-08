import { ChevronDown } from 'lucide-react';
import type { ServiceInfo } from '../types';

/** Collapsible "How this works" box inside a service card. Uses native <details>. */
export function ServiceInfoPanel({ info }: { info: ServiceInfo }) {
    return (
        <details className="group border-base-200 mt-4 border-t pt-3">
            <summary className="text-primary flex cursor-pointer list-none items-center gap-1 text-xs font-medium select-none [&::-webkit-details-marker]:hidden">
                <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
                How this works
            </summary>

            <div className="text-base-content/70 mt-3 space-y-3 text-xs">
                <p>{info.what}</p>

                <div>
                    <p className="text-base-content font-medium">How we check</p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-4">
                        {info.how.map((line) => (
                            <li key={line}>{line}</li>
                        ))}
                    </ul>
                </div>

                <div className="space-y-1">
                    <p>
                        <span className="text-warning font-medium">Degraded when: </span>
                        {info.degradedWhen}
                    </p>
                    <p>
                        <span className="text-error font-medium">Down when: </span>
                        {info.downWhen}
                    </p>
                </div>

                <div className="bg-base-200/60 rounded-lg p-2.5">
                    <p className="text-base-content font-medium">What to do now</p>
                    <p className="mt-0.5">{info.nextStep}</p>
                </div>
            </div>
        </details>
    );
}
