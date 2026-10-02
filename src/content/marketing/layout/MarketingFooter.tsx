import Link from 'next/link';
import { Container } from '../../../components/marketing/primitives/Container';
import { CTAButton } from '../../../components/marketing/primitives/CTAButton';
import { FOOTER_LINKS, SITE } from '@/content/marketing/site';

export function MarketingFooter() {
  return (
    <footer className="border-t border-mk-line bg-mk-surface">
      <Container className="py-12 sm:py-16">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4 lg:grid-cols-6">
          <div className="col-span-2 md:col-span-4 lg:col-span-2">
            <Link href="/" className="mk-heading text-xl font-bold">{SITE.name}</Link>
            <p className="mt-3 max-w-xs text-sm text-mk-muted">{SITE.tagline}</p>
            <CTAButton href="/signup" className="mt-5">Get started free</CTAButton>
          </div>

          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <nav key={group} aria-label={group}>
              <p className="text-sm font-semibold">{group}</p>
              <ul className="mt-4 space-y-3">
                {links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-mk-muted transition hover:text-mk-fg">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col-reverse items-start justify-between gap-4 border-t border-mk-line pt-6 sm:flex-row sm:items-center">
          <p className="text-sm text-mk-muted">
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>  
        </div>
      </Container>
    </footer>
  );
}