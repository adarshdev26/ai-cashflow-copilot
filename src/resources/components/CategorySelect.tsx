'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Plus, Search } from 'lucide-react';
import { useCategories } from '../hooks/use-categories';

interface CategorySelectProps {
  value: string | null;
  onChange: (id: string | null) => void;
  disabled?: boolean;
  id?: string;
  /** Only offer categories that fit this transaction type. */
  transactionType?: 'CREDIT' | 'DEBIT';
  /** When set, shows a "+ Add category" footer that calls this instead of changing the value. */
  onAddNew?: () => void;
}

type Option = { id: string | null; name: string; color: string | null; inactive: boolean };

const PANEL_HEIGHT = 320; // search box + list + footer, used to decide open direction

export function CategorySelect({ value, onChange, disabled, id, transactionType, onAddNew }: CategorySelectProps) {
  const { data: categories, isLoading, error } = useCategories();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [openUp, setOpenUp] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Inactive categories are hidden, except the one already selected (so old transactions still display).
  const options = useMemo<Option[]>(() => {
    const q = query.trim().toLowerCase();
    const list = (categories ?? [])
      .filter((c) => {
        const activeOk = c.isActive !== false || c.id === value;
        const typeOk = !transactionType || !c.type || c.type === 'BOTH' || c.type === transactionType;
        const searchOk = !q || c.name.toLowerCase().includes(q);
        return activeOk && typeOk && searchOk;
      })
      .map((c) => ({ id: c.id, name: c.name, color: c.color, inactive: c.isActive === false }));
    return q ? list : [{ id: null, name: 'No category', color: null, inactive: false }, ...list];
  }, [categories, value, transactionType, query]);

  const selected = categories?.find((c) => c.id === value);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  const openPanel = () => {
    if (disabled || isLoading) return;
    const rect = rootRef.current?.getBoundingClientRect();
    if (rect) {
      const below = window.innerHeight - rect.bottom;
      setOpenUp(below < PANEL_HEIGHT && rect.top > below);
    }
    const currentIndex = options.findIndex((o) => o.id === value);
    setActiveIndex(currentIndex >= 0 ? currentIndex : 0);
    setOpen(true);
  };

  const pick = (option: Option) => {
    onChange(option.id);
    close();
  };

  // focus the search box when opening
  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, close]);

  // keep the highlighted row in view
  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault(); // don't submit the transaction form
      const option = options[activeIndex];
      if (option) pick(option);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation(); // don't close the parent modal
      close();
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        disabled={disabled || isLoading}
        onClick={() => (open ? close() : openPanel())}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-left text-sm text-base-content focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:bg-base-200 disabled:text-base-content/50"
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected?.color && (
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: selected.color }} />
          )}
          <span className={`truncate ${selected ? '' : 'text-base-content/60'}`}>
            {isLoading ? 'Loading categories...' : selected ? selected.name : 'No category'}
            {selected?.isActive === false ? ' (inactive)' : ''}
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-base-content/50 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className={`absolute left-0 right-0 z-50 overflow-hidden rounded-lg border border-base-300 bg-base-100 shadow-lg ${
            openUp ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}
        >
          <div className="flex items-center gap-2 border-b border-base-200 px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-base-content/50" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search categories..."
              className="w-full bg-transparent text-sm text-base-content placeholder:text-base-content/50 focus:outline-none"
              aria-label="Search categories"
            />
          </div>

          <ul ref={listRef} role="listbox" className="max-h-56 overflow-y-auto py-1">
            {options.length === 0 ? (
              <li className="px-3 py-3 text-sm text-base-content/60">No categories found</li>
            ) : (
              options.map((option, index) => {
                const isSelected = option.id === value;
                return (
                  <li
                    key={option.id ?? 'none'}
                    role="option"
                    aria-selected={isSelected}
                    data-index={index}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(e) => e.preventDefault()} // keep focus in the search box
                    onClick={() => pick(option)}
                    className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm ${
                      index === activeIndex ? 'bg-primary/10 text-primary' : 'text-base-content/80'
                    } ${option.inactive ? 'text-base-content/50' : ''}`}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      {option.color ? (
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: option.color }} />
                      ) : (
                        <span className="h-2.5 w-2.5 shrink-0" />
                      )}
                      <span className="truncate">
                        {option.name}
                        {option.inactive ? ' (inactive)' : ''}
                      </span>
                    </span>
                    {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                  </li>
                );
              })
            )}
          </ul>

          {onAddNew && (
            <button
              type="button"
              onClick={() => {
                close();
                onAddNew();
              }}
              className="flex w-full items-center gap-2 border-t border-base-200 px-3 py-2.5 text-left text-sm font-medium text-primary hover:bg-primary/10"
            >
              <Plus className="h-4 w-4" />
              Add category{query.trim() ? ` "${query.trim()}"` : ''}
            </button>
          )}
        </div>
      )}

      {error && <p className="mt-1 text-xs text-error">Failed to load categories</p>}
    </div>
  );
}
