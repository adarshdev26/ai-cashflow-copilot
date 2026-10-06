import type { Metadata, Viewport } from 'next';
import { connection } from 'next/server';
import { Inter, DM_Sans, Bricolage_Grotesque } from 'next/font/google';
import './globals.css';
import { ReactQueryProvider } from '@/components/providers/ReactQueryProvider';
import { AppToaster } from '@/components/ui/AppToaster';
import { SITE } from '@/content/marketing/site';
import { AppThemeProvider } from '@/components/providers/AppThemeProvider';
import { getSystemSettings } from '@/lib/settings/server';

const inter = Inter({
    variable: '--font-inter',
    subsets: ['latin'],
});

const dmSans = DM_Sans({
    variable: '--font-dm-sans',
    subsets: ['latin'],
});

const bricolage = Bricolage_Grotesque({
    variable: '--font-bricolage',
    subsets: ['latin'],
});

export async function generateMetadata(): Promise<Metadata> {
    await connection();
    const settings = await getSystemSettings();
    const name = String(settings['branding.name'] ?? SITE.name);
    const description = String(settings['branding.description'] ?? SITE.description);
    return {
        metadataBase: new URL(SITE.url),
        title: { default: name, template: `%s | ${name}` },
        description,
        openGraph: { type: 'website', siteName: name, title: name, description, url: '/' },
        twitter: { card: 'summary_large_image', title: name, description },
    };
}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
    return (
        <html
            lang="en"
            suppressHydrationWarning
            className={`${inter.variable} ${dmSans.variable} ${bricolage.variable} h-full antialiased`}
        >
            <body className="bg-base-100 text-base-content flex min-h-full flex-col">
                <AppThemeProvider>
                    <ReactQueryProvider>
                        {children}
                        <AppToaster />
                    </ReactQueryProvider>
                </AppThemeProvider>
            </body>
        </html>
    );
}
