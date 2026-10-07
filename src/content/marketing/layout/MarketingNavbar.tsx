import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Container } from '../../../components/marketing/primitives/Container';
import { CTAButton } from '../../../components/marketing/primitives/CTAButton';
import { MobileMenu } from './MobileMenu';
import { ThemeMenu } from '@/components/ui/ThemePicker';
import { getSession } from '@/lib/auth/auth';
import { NAV_LINKS, SITE } from '@/content/marketing/site';
import { getSystemSettings } from '@/lib/settings/server';

export async function MarketingNavbar() {
    const [session, settings] = await Promise.all([getSession(), getSystemSettings()]);
    const isLoggedIn = Boolean(session);
    const siteName = String(settings['branding.name'] ?? SITE.name);
    const signupEnabled = settings['auth.signupEnabled'] !== false;

    return (
        <header className="border-mk-line bg-mk-bg/80 sticky top-0 z-40 border-b backdrop-blur">
            <Container className="flex h-16 items-center justify-between">
                <Link href="/" className="mk-heading text-xl font-bold">
                    {siteName}
                </Link>

                <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
                    {NAV_LINKS.map((l) => (
                        <Link
                            key={l.href}
                            href={l.href}
                            className="text-mk-muted hover:text-mk-fg rounded-md px-3 py-2 text-sm font-medium"
                        >
                            {l.label}
                        </Link>
                    ))}
                </nav>

                <div className="hidden items-center gap-2 md:flex">
                    <ThemeMenu />
                    {isLoggedIn ? (
                        <CTAButton href="/dashboard" className="gap-1.5">
                            Open {siteName}
                            <ArrowUpRight size={16} aria-hidden />
                        </CTAButton>
                    ) : (
                        <>
                            <CTAButton href="/login" variant="ghost">
                                Log in
                            </CTAButton>
                            {signupEnabled && <CTAButton href="/signup">Get started</CTAButton>}
                        </>
                    )}
                </div>

                <MobileMenu
                    links={NAV_LINKS}
                    isLoggedIn={isLoggedIn}
                    siteName={siteName}
                    signupEnabled={signupEnabled}
                />
            </Container>
        </header>
    );
}
