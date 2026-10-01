import Link from 'next/link';
import { Container } from '../../../components/marketing/primitives/Container';
import { FOOTER_LINKS, SITE } from '@/content/marketing/site';

export function MarketingFooter() {
  return (
    <footer className="border-t border-mk-line bg-mk-surface">
      <Container className="py-12">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <p className="mk-heading text-xl font-bold">{SITE.name}</p>
            <p className="mt-3 max-w-xs text-sm text-mk-muted">{SITE.tagline}</p>
          </div>
          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <nav key={group} aria-label={group}>
              <p className="text-sm font-semibold">{group}</p>
              <ul className="mt-3 space-y-2">
                {links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-mk-muted hover:text-mk-fg">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <p className="mt-10 border-t border-mk-line pt-6 text-sm text-mk-muted">
          © {new Date().getFullYear()} {SITE.name}. All rights reserved.
        </p>
      </Container>
    </footer>
  );
}