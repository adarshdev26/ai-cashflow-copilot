'use client';

import { Input } from '@/components/ui/Input';

type FilterDateRangeProps = {
    from: string;
    to: string;
    onChange: (next: { from: string; to: string }) => void;
    error?: string;
    disabled?: boolean;
};

export function FilterDateRange({ from, to, onChange, error, disabled }: FilterDateRangeProps) {
    return (
        <div>
            <div className="flex flex-wrap items-center gap-2">
                <label className="text-base-content/60 flex items-center gap-2 text-xs">
                    <span className="hidden sm:inline">From</span>
                    <span className="w-36">
                        <Input
                            aria-label="From"
                            type="date"
                            className="h-10"
                            value={from}
                            max={to || undefined}
                            disabled={disabled}
                            onChange={(event) => onChange({ from: event.target.value, to })}
                        />
                    </span>
                </label>
                <label className="text-base-content/60 flex items-center gap-2 text-xs">
                    <span className="hidden sm:inline">To</span>
                    <span className="w-36">
                        <Input
                            aria-label="To"
                            type="date"
                            className="h-10"
                            value={to}
                            min={from || undefined}
                            disabled={disabled}
                            onChange={(event) => onChange({ from, to: event.target.value })}
                        />
                    </span>
                </label>
            </div>
            {error && <p className="text-error mt-1 text-xs">{error}</p>}
        </div>
    );
}
