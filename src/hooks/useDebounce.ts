import { useEffect, useState } from 'react';

/**
 * Returns `value`, but only after it has stopped changing for `delay` ms.
 * Use it to slow down anything that reacts to fast-changing input
 * (search boxes, sliders, resize handlers).
 *
 * const [text, setText] = useState('');
 * const debouncedText = useDebounce(text, 400);
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    if (delay <= 0) {
      setDebouncedValue(value);
      return;
    }
    const id = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debouncedValue;
}