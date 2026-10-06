'use client';
import { ThemeProvider } from 'next-themes';
import { THEMES, THEME_VALUE } from '@/lib/ui/themes';

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider
            attribute="data-theme"
            themes={[...THEMES]}
            value={THEME_VALUE}
            defaultTheme="system"
            enableSystem
            enableColorScheme={false}
            storageKey="app-theme"
            disableTransitionOnChange
        >
            {children}
        </ThemeProvider>
    );
}
