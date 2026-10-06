export const THEMES = [
    'light',
    'dark',
    'emerald',
    'synthwave',
    'retro',
    'halloween',
    'garden',
    'forest',
    'black',
    'luxury',
    'dracula',
    'autumn',
    'night',
    'coffee',
    'dim',
    'sunset',
    'caramellatte',
    'abyss',
] as const;

export type AppTheme = (typeof THEMES)[number];

const ATTR: Record<string, string> = {
    light: 'cashflow',
    dark: 'cashflow-dark',
};

export const attrOf = (t: string) => ATTR[t] ?? t;

export const labelOf = (t: string) =>
    t === 'system'
        ? 'System'
        : t === 'light'
          ? 'Default light'
          : t === 'dark'
            ? 'Default dark'
            : t;

export const THEME_VALUE: Record<string, string> = Object.fromEntries(
    THEMES.map((t) => [t, attrOf(t)]),
);
