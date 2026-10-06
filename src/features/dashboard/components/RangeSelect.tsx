interface RangeOption<T extends string | number> {
    value: T;
    label: string;
}

interface RangeSelectProps<T extends string | number> {
    label: string;
    value: T;
    options: RangeOption<T>[];
    onChange: (value: T) => void;
    disabled?: boolean;
}

export function RangeSelect<T extends string | number>({
    label,
    value,
    options,
    onChange,
    disabled,
}: RangeSelectProps<T>) {
    return (
        <select
            aria-label={label}
            disabled={disabled}
            value={value}
            onChange={(event) => {
                // <select> only gives back strings, so map back to the original value (number or string)
                const next = options.find((option) => String(option.value) === event.target.value);
                if (next) onChange(next.value);
            }}
            className="border-base-300 bg-base-100 text-base-content/80 focus:ring-primary/20 focus:border-primary rounded-lg border px-2.5 py-1.5 text-xs font-medium focus:ring-2 focus:outline-none"
        >
            {options.map((option) => (
                <option key={String(option.value)} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
}
