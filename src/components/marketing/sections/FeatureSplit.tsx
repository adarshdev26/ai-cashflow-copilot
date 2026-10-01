import { Check } from 'lucide-react';
import { Section } from '../primitives/Section';
import { GridBackground } from '../primitives/GridBackground';
import { cx } from '../primitives/cx';
import type { FeatureDetail } from '@/content/marketing/features';

export function FeatureSplit({ items }: { items: FeatureDetail[] }) {
  return (
    <Section className="space-y-16 sm:space-y-24">
      {items.map(({ icon: Icon, eyebrow, title, description, bullets }, i) => (
        <div key={title} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
          <div className={cx(i % 2 === 1 && 'lg:order-2')}>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-mk-brand">{eyebrow}</p>
            <h2 className="mk-heading text-3xl font-bold">{title}</h2>
            <p className="mt-4 text-lg text-mk-muted">{description}</p>
          </div>

          {/* Visual slot: replace with a real screenshot via next/image */}
          <div className="relative isolate overflow-hidden rounded-2xl border border-mk-line bg-mk-surface p-5 sm:p-8">
            <GridBackground />
            <div className="mb-4 flex items-center gap-3">
              <span className="inline-flex size-9 items-center justify-center rounded-lg bg-mk-brand/15 text-mk-brand">
                <Icon size={18} />
              </span>
              <span className="text-sm font-semibold">{eyebrow}</span>
            </div>
            <ul className="space-y-2">
              {bullets.map((b) => (
                <li
                  key={b}
                  className="flex items-center gap-3 rounded-lg border border-mk-line bg-mk-bg/80 px-4 py-3 text-sm backdrop-blur"
                >
                  <Check size={16} className="shrink-0 text-mk-brand" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </Section>
  );
}