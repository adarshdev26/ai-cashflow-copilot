import { useCallback, useMemo, useState } from 'react';

export function useFilters<TFilters extends Record<string, unknown>>(defaultFilters: TFilters) {
    const [filters, setFiltersState] = useState<TFilters>(() => ({ ...defaultFilters }));

    const setFilter = useCallback(
        <TKey extends keyof TFilters>(key: TKey, value: TFilters[TKey]) => {
            setFiltersState((currentFilters) => ({ ...currentFilters, [key]: value }));
        },
        [],
    );

    const setFilters = useCallback((partialFilters: Partial<TFilters>) => {
        setFiltersState((currentFilters) => ({ ...currentFilters, ...partialFilters }));
    }, []);

    const resetFilters = useCallback(() => {
        setFiltersState({ ...defaultFilters });
    }, [defaultFilters]);

    const hasActiveFilters = useMemo(
        () =>
            Object.keys(defaultFilters).some(
                (key) => !Object.is(filters[key], defaultFilters[key]),
            ),
        [defaultFilters, filters],
    );

    return { filters, setFilter, setFilters, resetFilters, hasActiveFilters };
}
