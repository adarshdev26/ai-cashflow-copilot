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

  const close = () => (document.activeElement as HTMLElement | null)?.blur();

  return (
    <div className="dropdown dropdown-end">
      <button type="button" tabIndex={0} data-tour="theme-switcher" aria-label="Change theme" className="btn btn-ghost btn-sm gap-1.5">
        <Palette className="h-4 w-4" />
        <span className="hidden sm:inline">{mounted ? labelOf(theme ?? 'system') : 'Theme'}</span>
      </button>

      <div
        tabIndex={0}
        className="dropdown-content z-50 mt-2 w-72 max-h-[28rem] overflow-y-auto rounded-box border border-base-300 bg-base-100 p-2 text-base-content shadow-xl"
      >
        {/* System option (uses the current app colors) */}
        <button
          type="button"
          onClick={() => {
            setTheme('system');
            close();
          }}
          className={`mb-1 flex w-full items-center justify-between rounded-lg border-2 px-3 py-2 text-left text-sm font-medium transition ${
            mounted && theme === 'system' ? 'border-primary' : 'border-transparent hover:border-base-300'
          }`}
        >
          <span>System</span>
          {mounted && theme === 'system' && <Check className="h-4 w-4 text-primary" />}
        </button>

        <div className="space-y-1">
          {THEMES.map((t) => {
            const active = mounted && theme === t;
            return (
              <button
                key={t}
                type="button"
                data-theme={attrOf(t)}
                aria-pressed={active}
                onClick={() => {
                  setTheme(t);
                  close();
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-lg border-2 bg-base-100 px-3 py-2 text-left text-base-content transition ${
                  active ? 'border-primary' : 'border-base-300 hover:border-base-content/40'
                }`}
              >
                <span className="flex min-w-0 items-center gap-1.5 truncate text-sm font-medium capitalize">
                  {labelOf(t)}
                  {active && <Check className="h-4 w-4 shrink-0 text-primary" />}
                </span>
                <span className="flex shrink-0 gap-1">
                  <span className="h-4 w-4 rounded-full bg-primary" />
                  <span className="h-4 w-4 rounded-full bg-secondary" />
                  <span className="h-4 w-4 rounded-full bg-accent" />
                  <span className="h-4 w-4 rounded-full bg-neutral" />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

