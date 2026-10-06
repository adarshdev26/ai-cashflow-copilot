export const THEMES = [
    'light',
    'dark', // = Default (cashflow / cashflow-dark)
    'cupcake',
    'bumblebee',
    'emerald',
    'corporate',
    'synthwave',
    'retro',
    'cyberpunk',
    'valentine',
    'halloween',
    'garden',
    'forest',
    'aqua',
    'lofi',
    'pastel',
    'fantasy',
    'wireframe',
    'black',
    'luxury',
    'dracula',
    'cmyk',
    'autumn',
    'business',
    'acid',
    'lemonade',
    'night',
    'coffee',
    'winter',
    'dim',
    'nord',
    'sunset',
    'caramellatte',
    'abyss',
    'silk',
] as const;
export type AppTheme = (typeof THEMES)[number];

const ATTR: Record<string, string> = { light: 'cashflow', dark: 'cashflow-dark' };
export const attrOf = (t: string) => ATTR[t] ?? t;

export const labelOf = (t: string) =>
    t === 'system' ? 'System' : t === 'light' ? 'Default light' : t === 'dark' ? 'Default dark' : t;

export const THEME_VALUE: Record<string, string> = Object.fromEntries(
    THEMES.map((t) => [t, attrOf(t)]),
);
