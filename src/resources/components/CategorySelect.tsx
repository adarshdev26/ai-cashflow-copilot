'use client';

import { useCallback } from 'react';
import { useCategories } from '../hooks/use-categories';
import { Select } from '@/components/ui/Select';

interface CategorySelectProps {
  value: string | null;
  onChange: (id: string | null) => void;
  disabled?: boolean;
  id?: string;
}

export function CategorySelect({ value, onChange, disabled, id }: CategorySelectProps) {
  const { data: categories, isLoading, error } = useCategories();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange(e.target.value === '' ? null : e.target.value);
    },
    [onChange]
  );

  return (
    <div>
      <Select
        id={id}
        value={value || ''}
        onChange={handleChange}
        disabled={disabled || isLoading}
      >
        <option value="">No category</option>
        {isLoading && <option disabled>Loading categories...</option>}
        {categories?.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </Select>
      {error && (
        <p className="mt-1 text-xs text-red-500">Failed to load categories</p>
      )}
    </div>
  );
}
