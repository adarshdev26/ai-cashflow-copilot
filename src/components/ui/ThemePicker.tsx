'use client';
import { useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import { Palette, Check } from 'lucide-react';
import { THEMES, attrOf, labelOf } from '@/lib/ui/themes';
import { useUpdateUserPreferences } from '@/features/settings/hooks/use-settings';

const noop = () => () => {};
const useMounted = () =>
    useSyncExternalStore(
        noop,
        () => true,
        () => false,
    );

export function ThemeMenu({ persistPreference = false }: { persistPreference?: boolean }) {
    const { theme, setTheme } = useTheme();
    const updatePreference = useUpdateUserPreferences();
    const mounted = useMounted();

    const selectTheme = (next: string) => {
        setTheme(next);
        if (persistPreference) updatePreference.mutate({ theme: next });
    };

    const close = () => (document.activeElement as HTMLElement | null)?.blur();

    return (
        <div className="dropdown dropdown-end">
            <button
                type="button"
                tabIndex={0}
                data-tour="theme-switcher"
                aria-label="Change theme"
                className="btn btn-ghost btn-sm gap-1.5"
            >
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">
                    {mounted ? labelOf(theme ?? 'system') : 'Theme'}
                </span>
            </button>

            <div
                tabIndex={0}
                className="dropdown-content rounded-box border-base-300 bg-base-100 text-base-content z-50 mt-2 max-h-[28rem] w-72 overflow-y-auto border p-2 shadow-xl"
            >
                {/* System option (uses the current app colors) */}
                <button
                    type="button"
                    onClick={() => {
                        selectTheme('system');
                        close();
                    }}
                    className={`mb-1 flex w-full items-center justify-between rounded-lg border-2 px-3 py-2 text-left text-sm font-medium transition ${
                        mounted && theme === 'system'
                            ? 'border-primary'
                            : 'hover:border-base-300 border-transparent'
                    }`}
                >
                    <span>System</span>
                    {mounted && theme === 'system' && <Check className="text-primary h-4 w-4" />}
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
                                    selectTheme(t);
                                    close();
                                }}
                                className={`bg-base-100 text-base-content flex w-full items-center justify-between gap-3 rounded-lg border-2 px-3 py-2 text-left transition ${
                                    active
                                        ? 'border-primary'
                                        : 'border-base-300 hover:border-base-content/40'
                                }`}
                            >
                                <span className="flex min-w-0 items-center gap-1.5 truncate text-sm font-medium capitalize">
                                    {labelOf(t)}
                                    {active && <Check className="text-primary h-4 w-4 shrink-0" />}
                                </span>
                                <span className="flex shrink-0 gap-1">
                                    <span className="bg-primary h-4 w-4 rounded-full" />
                                    <span className="bg-secondary h-4 w-4 rounded-full" />
                                    <span className="bg-accent h-4 w-4 rounded-full" />
                                    <span className="bg-neutral h-4 w-4 rounded-full" />
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
