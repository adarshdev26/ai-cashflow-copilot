'use client';

import { Tooltip } from 'recharts';
import { formatINR } from './chart-formatters';

export function ChartTooltip({
    formatValue,
    locale = 'en-IN',
}: {
    formatValue?: (value: number) => string;
    locale?: string;
}) {
    const format = formatValue ?? ((value: number) => formatINR(value, locale));
    return (
        <Tooltip
            formatter={(value) => format(Number(value))}
            contentStyle={{
                background: 'var(--color-base-100)',
                border: '1px solid var(--color-base-300)',
                color: 'var(--color-base-content)',
            }}
        />
    );
}
