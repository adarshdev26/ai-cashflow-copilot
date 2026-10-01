import { Section } from '../primitives/Section';
import { SectionHeader } from '../primitives/SectionHeader';
import { cx } from '../primitives/cx';
import type { Feature } from '@/content/marketing/features';

type Props = { eyebrow?: string; title: string; subtitle?: string; items: Feature[] };

// Cards at these indexes span two columns on large screens
const WIDE = new Set([0, 3]);

export function FeatureBento({ eyebrow, title, subtitle, items }: Props) {
  return (
    <Section pattern="dots">
      <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        {items.map(({ icon: Icon, title, description }, i) => (
          <div
            key={title}
            className={cx(
              'relative overflow-hidden rounded-2xl border border-mk-line bg-mk-surface/70 p-6 transition hover:border-mk-brand/40 sm:p-8',
              WIDE.has(i) && 'lg:col-span-2',
            )}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--mk-brand)_18%,transparent),transparent)]"
            />
            <span className="relative inline-flex size-11 items-center justify-center rounded-xl border border-mk-line bg-mk-bg text-mk-brand">
              <Icon size={20} />
            </span>
            <h3 className="mk-heading relative mt-5 text-xl font-semibold">{title}</h3>
            <p className="relative mt-2 max-w-md text-mk-muted">{description}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}