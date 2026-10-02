import { Section } from '../primitives/Section';
import { SectionHeader } from '../primitives/SectionHeader';
import { Reveal } from '../primitives/Reveal';
import type { Feature } from '@/content/marketing/features';

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  items: Feature[];
  tone?: 'default' | 'muted';
  pattern?: 'grid' | 'dots';
  columns?: 2 | 3;
};

export function FeatureGrid({ eyebrow, title, subtitle, items, tone = 'default', pattern, columns = 3 }: Props) {
  return (
    <Section tone={tone} pattern={pattern}>
      <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <div className={`mt-14 grid gap-5 sm:grid-cols-2 ${columns === 3 ? 'lg:grid-cols-3' : ''}`}>
        {items.map(({ icon: Icon, title, description }, i) => (
          <Reveal key={title} delay={(i % 3) * 80} className="h-full">
            <div className="mk-card group h-full rounded-2xl border border-mk-line bg-mk-surface/60 p-7 backdrop-blur">
              <span className="inline-flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-mk-brand/25 to-mk-brand/5 text-mk-brand ring-1 ring-mk-brand/20 transition group-hover:scale-105">
                <Icon size={22} />
              </span>
              <h3 className="mk-heading mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mk-muted">{description}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}