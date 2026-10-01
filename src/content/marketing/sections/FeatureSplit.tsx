import { Check } from 'lucide-react';
import { Section } from '../../../components/marketing/primitives/Section';
import type { FeatureDetail } from '@/content/marketing/features';

export function FeatureSplit({ items, tone = 'default' }: { items: FeatureDetail[]; tone?: 'default' | 'muted' }) {
  return (
    <Section tone={tone} className="space-y-20 sm:space-y-28">
      {items.map(({ icon: Icon, eyebrow, title, description, bullets }, i) => (
        <div key={title} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className={i % 2 === 1 ? 'lg:order-2' : ''}>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-mk-brand">{eyebrow}</p>
            <h2 className="mk-heading text-3xl font-bold">{title}</h2>
            <p className="mt-4 text-lg text-mk-muted">{description}</p>
            <ul className="mt-6 space-y-3">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <Check size={18} className="mt-1 shrink-0 text-mk-brand" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* Visual slot: swap for a real screenshot with next/image */}
          <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-mk-line bg-gradient-to-br from-mk-brand/10 to-mk-surface">
            <Icon size={72} className="text-mk-brand" strokeWidth={1.25} />
          </div>
        </div>
      ))}
    </Section>
  );
}