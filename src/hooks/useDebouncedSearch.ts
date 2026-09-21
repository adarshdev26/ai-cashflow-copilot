import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { useDebounce } from './useDebounce'; // adjust path if needed: '@/hooks/useDebounce'

/**
 * Debounced search box logic, independent of any table or API.
 *
 * - `committedValue`: the value that currently lives in your state/query.
 * - `onCommit`: called with the new value once the user pauses typing.
 *
 * Returns `value` + `onChange` to spread onto an <input>.
 */
export function useDebouncedSearch(
  committedValue: string,
  onCommit: (value: string) => void,
  delay = 400
) {
  const [input, setInput] = useState(committedValue);
  const debounced = useDebounce(input, delay);

  // input -> outside (only when the debounced value changes)
  useEffect(() => {
    if (debounced !== committedValue) onCommit(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  // outside -> input (e.g. "reset filters"); skipped while typing is pending
  useEffect(() => {
    if (input === debounced) setInput(committedValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [committedValue]);

  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => setInput(e.target.value),
    []
  );

  return { value: input, onChange };
}