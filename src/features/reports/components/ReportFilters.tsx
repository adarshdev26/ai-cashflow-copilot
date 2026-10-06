'use client';

import { PRESETS, type PresetId } from '../lib/report-filters';
import type { ReportFilters as Filters, ReportResponse } from '../types';

const field = 'select select-bordered select-sm w-full';

export type FilterState = Filters & { preset: PresetId };

export function ReportFilters({
    value,
    onChange,
    options,
}: {
    value: FilterState;
    onChange: (next: Partial<FilterState>) => void;
    options?: ReportResponse['options'];
}) {
    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <label className="space-y-1">
                    <span className="text-base-content/70 block text-xs font-medium">
                        Date range
                    </span>
                    <select
                        className={field}
                        value={value.preset}
                        onChange={(e) => onChange({ preset: e.target.value as PresetId })}
                    >
                        {PRESETS.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.label}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="space-y-1">
                    <span className="text-base-content/70 block text-xs font-medium">Account</span>
                    <select
                        className={field}
                        value={value.accountId ?? ''}
                        onChange={(e) => onChange({ accountId: e.target.value || undefined })}
                    >
                        <option value="">All accounts</option>
                        {options?.accounts.map((a) => (
                            <option key={a.id} value={a.id}>
                                {a.name}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="space-y-1">
                    <span className="text-base-content/70 block text-xs font-medium">Category</span>
                    <select
                        className={field}
                        value={value.categoryId ?? ''}
                        onChange={(e) => onChange({ categoryId: e.target.value || undefined })}
                    >
                        <option value="">All categories</option>
                        {options?.categories.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="space-y-1">
                    <span className="text-base-content/70 block text-xs font-medium">Type</span>
                    <select
                        className={field}
                        value={value.type ?? ''}
                        onChange={(e) =>
                            onChange({ type: (e.target.value || undefined) as Filters['type'] })
                        }
                    >
                        <option value="">All types</option>
                        <option value="CREDIT">Income</option>
                        <option value="DEBIT">Expense</option>
                    </select>
                </label>
            </div>

            {value.preset === 'custom' && (
                <div className="grid max-w-md grid-cols-2 gap-3">
                    <label className="space-y-1">
                        <span className="text-base-content/70 block text-xs font-medium">From</span>
                        <input
                            type="date"
                            className="input input-bordered input-sm w-full"
                            value={value.from}
                            max={value.to}
                            onChange={(e) => e.target.value && onChange({ from: e.target.value })}
                        />
                    </label>
                    <label className="space-y-1">
                        <span className="text-base-content/70 block text-xs font-medium">To</span>
                        <input
                            type="date"
                            className="input input-bordered input-sm w-full"
                            value={value.to}
                            min={value.from}
                            onChange={(e) => e.target.value && onChange({ to: e.target.value })}
                        />
                    </label>
                </div>
            )}
        </div>
    );
}
