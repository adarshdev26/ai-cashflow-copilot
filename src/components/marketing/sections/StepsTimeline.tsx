import { UserPlus, ReceiptText, TrendingUp, Users } from 'lucide-react';
import { Section } from '../primitives/Section';
import { SectionHeader } from '../primitives/SectionHeader';
import { Reveal } from '../primitives/Reveal';
import { cx } from '../primitives/cx';

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  steps: { title: string; description: string }[];
  tone?: 'default' | 'muted';
};

const ICONS = [UserPlus, ReceiptText, TrendingUp, Users];

export function StepsTimeline({ eyebrow, title, subtitle, steps, tone = 'muted' }: Props) {
  return (
    <Section tone={tone}>
      <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <ol
        className={cx(
          'mt-14 grid gap-5 md:grid-cols-2',
          steps.length >= 4 ? 'lg:grid-cols-4' : steps.length === 3 ? 'lg:grid-cols-3' : '',
        )}
      >
        {steps.map((s, i) => {
          const Icon = ICONS[i % ICONS.length];
          return (
            <li key={s.title}>
              <Reveal delay={i * 100} className="h-full">
                <div className="mk-card h-full rounded-2xl border border-mk-line bg-mk-bg p-7">
                  <div className="flex items-start justify-between">
                    <span className="inline-flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-mk-brand/25 to-mk-brand/5 text-mk-brand ring-1 ring-mk-brand/20">
                      <Icon size={22} aria-hidden />
                    </span>
                    <span aria-hidden className="mk-heading text-5xl font-bold text-mk-fg/10">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="mk-heading mt-6 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-mk-muted">{s.description}</p>
                </div>
              </Reveal>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}