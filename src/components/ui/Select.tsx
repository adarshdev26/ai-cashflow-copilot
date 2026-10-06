'use client';

import {
  Children, forwardRef, isValidElement, useCallback, useEffect,
  useId, useMemo, useRef, useState,
} from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

type Opt = { value: string; label: ReactNode; disabled?: boolean };

function parseOptions(children: ReactNode): Opt[] {
  const out: Opt[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child) || child.type !== 'option') return;
    const p = child.props as React.OptionHTMLAttributes<HTMLOptionElement>;
    const label = p.children as ReactNode;
    out.push({
      value: p.value !== undefined ? String(p.value) : typeof label === 'string' ? label : '',
      label,
      disabled: p.disabled,
    });
  });
  return out;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(
  { className, children, value, defaultValue, onChange, disabled, name, id, style, ...rest },
  ref
) {
  const options = useMemo(() => parseOptions(children), [children]);
  const [inner, setInner] = useState(String(defaultValue ?? options[0]?.value ?? ''));
  const current = value !== undefined ? String(value) : inner;
  const selected = options.find((o) => o.value === current) ?? options[0];

  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const openMenu = useCallback(() => {
    if (disabled) return;
    const rect = wrapRef.current?.getBoundingClientRect();
    if (rect) setDropUp(window.innerHeight - rect.bottom < 280 && rect.top > 280);
    setActive(Math.max(0, options.findIndex((o) => o.value === current)));
    setOpen(true);
  }, [disabled, options, current]);

  const choose = useCallback((opt: Opt) => {
    if (opt.disabled) return;
    setInner(opt.value);
    setOpen(false);
    // Hand callers an event-shaped object so `e.target.value` keeps working.
    onChange?.({ target: { value: opt.value, name }, currentTarget: { value: opt.value, name } } as unknown as ChangeEvent<HTMLSelectElement>);
  }, [onChange, name]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Keep the highlighted option in view.
  useEffect(() => {
    if (open) listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); openMenu(); }
      return;
    }
    const step = (dir: 1 | -1) => {
      let i = active;
      for (let n = 0; n < options.length; n++) {
        i = (i + dir + options.length) % options.length;
        if (!options[i].disabled) break;
      }
      setActive(i);
    };
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); step(1); break;
      case 'ArrowUp': e.preventDefault(); step(-1); break;
      case 'Home': e.preventDefault(); setActive(0); break;
      case 'End': e.preventDefault(); setActive(options.length - 1); break;
      case 'Enter': case ' ': e.preventDefault(); choose(options[active]); break;
      case 'Escape': e.preventDefault(); e.stopPropagation(); setOpen(false); break; // preventDefault stops a parent <dialog> closing
      case 'Tab': setOpen(false); break;
    }
  };

  return (
    <div ref={wrapRef} className={cn('relative w-full', className)} style={style}>
      {name && <input type="hidden" name={name} value={current} />}
      <button
        ref={ref}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-full border border-base-300 bg-base-100',
          'py-2 pl-4 pr-3 text-left text-base sm:text-sm font-medium text-base-content/80 shadow-sm transition-all',
          'hover:border-base-content/30 hover:bg-base-200/50',
          'focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15',
          'disabled:cursor-not-allowed disabled:opacity-50',
          open && 'border-primary ring-4 ring-primary/15'
        )}
      >
        <span className="truncate">{selected?.label ?? ''}</span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-base-content/50 transition-transform duration-200', open && 'rotate-180')} />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className={cn(
            'absolute left-0 z-50 max-h-64 min-w-full w-max max-w-[min(20rem,90vw)] overflow-y-auto',
            'rounded-2xl border border-base-300 bg-base-100 p-1.5 shadow-xl ring-1 ring-black/5',
            'animate-in fade-in zoom-in-95 duration-150',
            dropUp ? 'bottom-full mb-2 origin-bottom' : 'top-full mt-2 origin-top'
          )}
        >
          {options.map((o, i) => {
            const isSelected = o.value === current;
            return (
              <li
                key={o.value || `opt-${i}`}
                role="option"
                aria-selected={isSelected}
                aria-disabled={o.disabled}
                onMouseEnter={() => !o.disabled && setActive(i)}
                onClick={() => choose(o)}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm transition-colors',
                  i === active && 'bg-base-200',
                  isSelected ? 'font-semibold text-primary' : 'text-base-content/80',
                  o.disabled && 'cursor-not-allowed opacity-40'
                )}
              >
                <span className="truncate">{o.label}</span>
                {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
});
Select.displayName = 'Select';