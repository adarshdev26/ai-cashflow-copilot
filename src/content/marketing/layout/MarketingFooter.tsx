import Link from 'next/link';
import { Container } from '../../../components/marketing/primitives/Container';
import { CTAButton } from '../../../components/marketing/primitives/CTAButton';
import { FOOTER_LINKS, SITE } from '@/content/marketing/site';
import { connection } from 'next/server';
import { getSystemSettings } from '@/lib/settings/server';

export async function MarketingFooter() {
    await connection();
    const settings = await getSystemSettings();
    const siteName = String(settings['branding.name'] ?? SITE.name);
    const tagline = String(settings['branding.tagline'] ?? SITE.tagline);
    const signupEnabled = settings['auth.signupEnabled'] !== false;
    return (
        <footer className="border-mk-line bg-mk-surface border-t">
            <Container className="py-12 sm:py-16">
                <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4 lg:grid-cols-6">
                    <div className="col-span-2 md:col-span-4 lg:col-span-2">
                        <Link href="/" className="mk-heading text-xl font-bold">
                            {siteName}
                        </Link>
                        <p className="text-mk-muted mt-3 max-w-xs text-sm">{tagline}</p>
                        <CTAButton href="/signup" className="mt-5">
                            Get started free
                        </CTAButton>
                    </div>

                    {Object.entries(FOOTER_LINKS).map(([group, links]) => (
                        <nav key={group} aria-label={group}>
                            <p className="text-sm font-semibold">{group}</p>
                            <ul className="mt-4 space-y-3">
                                {links
                                    .filter((link) => signupEnabled || link.href !== '/signup')
                                    .map((l) => (
                                        <li key={l.href}>
                                            <Link
                                                href={l.href}
                                                className="text-mk-muted hover:text-mk-fg text-sm transition"
                                            >
                                                {l.label}
                                            </Link>
                                        </li>
                                    ))}
                            </ul>
                        </nav>
                    ))}
                </div>

                <div className="border-mk-line mt-12 flex flex-col-reverse items-start justify-between gap-4 border-t pt-6 sm:flex-row sm:items-center">
                    <p className="text-mk-muted text-sm">
                        © {new Date().getFullYear()} {siteName}. All rights reserved.
                    </p>
                </div>
            </Container>
        </footer>
    );
}
