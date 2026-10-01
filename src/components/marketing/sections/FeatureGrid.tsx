import { Section } from '../primitives/Section';
import { SectionHeader } from '../primitives/SectionHeader';
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
      <div className={`mt-12 grid gap-4 sm:grid-cols-2 ${columns === 3 ? 'lg:grid-cols-3' : ''}`}>
        {items.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="group rounded-2xl border border-mk-line bg-mk-surface/60 p-6 backdrop-blur transition hover:border-mk-brand/40"
          >
            <span className="inline-flex size-10 items-center justify-center rounded-lg bg-mk-brand/15 text-mk-brand">
              <Icon size={20} />
            </span>
            <h3 className="mk-heading mt-4 text-lg font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-mk-muted">{description}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}