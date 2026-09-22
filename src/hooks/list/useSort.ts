import { useCallback, useState } from 'react';

export type SortDirection = 'asc' | 'desc';

export interface UseSortOptions<TSortField extends string> {
  defaultSortBy?: TSortField;
  defaultSortDir?: SortDirection;
}

export function useSort<TSortField extends string>({
  defaultSortBy,
  defaultSortDir = 'desc',
}: UseSortOptions<TSortField> = {}) {
  const [sortBy, setSortBy] = useState<TSortField | undefined>(defaultSortBy);
  const [sortDir, setSortDir] = useState<SortDirection>(defaultSortDir);

  const setSort = useCallback((field: TSortField | undefined, direction: SortDirection = 'asc') => {
    setSortBy(field);
    setSortDir(direction);
  }, []);

  const toggleSort = useCallback((field: TSortField) => {
    setSortBy((currentField) => {
      if (currentField !== field) {
        setSortDir('asc');
        return field;
      }
      setSortDir((currentDirection) => currentDirection === 'asc' ? 'desc' : 'asc');
      return currentField;
    });
  }, []);

  return { sortBy, sortDir, setSort, toggleSort };
}