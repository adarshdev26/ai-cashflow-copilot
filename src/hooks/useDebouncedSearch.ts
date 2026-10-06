import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { useDebounce } from './useDebounce';

export function useDebouncedSearch(
    committedValue: string,
    onCommit: (value: string) => void,
    delay = 400,
) {
    const [input, setInput] = useState(committedValue);
    const debounced = useDebounce(input, delay);

    // input -> outside (only when the debounced value changes)
    useEffect(() => {
        if (debounced !== committedValue) onCommit(debounced);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debounced]);

    // outside -> input (e.g. "reset filters"); skipped while typing is pending
    const [prevCommitted, setPrevCommitted] = useState(committedValue);
    if (committedValue !== prevCommitted) {
        setPrevCommitted(committedValue);
        if (input === debounced) setInput(committedValue);
    }

    const onChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => setInput(e.target.value),
        [],
    );

    return { value: input, onChange };
}
