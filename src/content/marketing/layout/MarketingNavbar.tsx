import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Container } from '../../../components/marketing/primitives/Container';
import { CTAButton } from '../../../components/marketing/primitives/CTAButton';
import { MobileMenu } from './MobileMenu';
import { ThemeMenu } from '@/components/ui/ThemePicker';
import { getSession } from '@/lib/auth';
import { NAV_LINKS, SITE } from '@/content/marketing/site';

export async function MarketingNavbar() {
  const session = await getSession();
  const isLoggedIn = Boolean(session);

  return (
    <header className="sticky top-0 z-40 border-b border-mk-line bg-mk-bg/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="mk-heading text-xl font-bold">
          {SITE.name}
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-md px-3 py-2 text-sm font-medium text-mk-muted hover:text-mk-fg">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeMenu />
          {isLoggedIn ? (
            <CTAButton href="/dashboard" className="gap-1.5">
              Open {SITE.name}
              <ArrowUpRight size={16} aria-hidden />
            </CTAButton>
          ) : (
            <>
              <CTAButton href="/login" variant="ghost">Log in</CTAButton>
              <CTAButton href="/signup">Get started</CTAButton>
            </>
          )}
        </div>

        <MobileMenu links={NAV_LINKS} isLoggedIn={isLoggedIn} />
      </Container>
    </header>
  );
}