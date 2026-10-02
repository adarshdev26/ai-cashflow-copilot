'use client';
import { useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import { Palette, Check } from 'lucide-react';
import { THEMES, attrOf, labelOf } from '@/lib/themes';

const noop = () => () => {};
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

export function ThemeMenu() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const options = ['system', ...THEMES];

  return (
    <div className="dropdown dropdown-end">
      <button type="button" tabIndex={0} aria-label="Change theme" className="btn btn-ghost btn-sm gap-1.5">
        <Palette className="h-4 w-4" />
        <span className="hidden capitalize sm:inline">{mounted ? labelOf(theme ?? 'system') : 'Theme'}</span>
      </button>
      <ul
        tabIndex={0}
        className="dropdown-content menu z-50 mt-2 max-h-96 w-52 flex-nowrap overflow-y-auto rounded-box border border-base-300 bg-base-100 p-2 text-base-content shadow-xl"
      >
        {options.map((t) => (
          <li key={t}>
            <button
              type="button"
              className={`capitalize ${mounted && theme === t ? 'menu-active' : ''}`}
              onClick={() => {
                setTheme(t);
                (document.activeElement as HTMLElement | null)?.blur();
              }}
            >
              {labelOf(t)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ThemeGrid() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setTheme('system')}
        className={`btn btn-sm ${mounted && theme === 'system' ? 'btn-primary' : 'btn-outline'}`}
      >
        Match system
      </button>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {THEMES.map((t) => {
          const active = mounted && theme === t;
          return (
            <button
              key={t}
              type="button"
              data-theme={attrOf(t)}
              aria-pressed={active}
              onClick={() => setTheme(t)}
              className={`rounded-lg border-2 bg-base-100 p-3 text-left transition ${
                active ? 'border-primary' : 'border-base-300 hover:border-base-content/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium capitalize text-base-content">{labelOf(t)}</span>
                {active && <Check className="h-4 w-4 text-primary" />}
              </div>
              <div className="mt-2 flex gap-1">
                <span className="h-4 w-4 rounded-full bg-primary" />
                <span className="h-4 w-4 rounded-full bg-secondary" />
                <span className="h-4 w-4 rounded-full bg-accent" />
                <span className="h-4 w-4 rounded-full bg-neutral" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}