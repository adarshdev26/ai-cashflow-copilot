'use client';

import { useCallback } from 'react';
import { useCategories } from '../hooks/use-categories';
import { Select } from '@/components/ui/Select';

interface CategorySelectProps {
  value: string | null;
  onChange: (id: string | null) => void;
  disabled?: boolean;
  id?: string;
  /** When set, shows a last "+ Add category…" option that calls this instead of changing the value. */
  onAddNew?: () => void;
}

const ADD_NEW = '__add_new__';

export function CategorySelect({ value, onChange, disabled, id, onAddNew }: CategorySelectProps) {
  const { data: categories, isLoading, error } = useCategories();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (e.target.value === ADD_NEW) {
        onAddNew?.();
        return;
      }
      onChange(e.target.value === '' ? null : e.target.value);
    },
    [onChange, onAddNew]
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
        {onAddNew && <option value={ADD_NEW}>+ Add category…</option>}
      </Select>
      {error && (
        <p className="mt-1 text-xs text-red-500">Failed to load categories</p>
      )}
    </div>
  );
}
