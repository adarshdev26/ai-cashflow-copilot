import { Section } from '../primitives/Section';
import { SectionHeader } from '../primitives/SectionHeader';

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  steps: { title: string; description: string }[];
  tone?: 'default' | 'muted';
};

export function StepsTimeline({ eyebrow, title, subtitle, steps, tone = 'muted' }: Props) {
  return (
    <Section tone={tone}>
      <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <ol className="mx-auto mt-12 max-w-2xl space-y-8">
        {steps.map((s, i) => (
          <li key={s.title} className="flex gap-5">
            <span className="mk-heading flex size-10 shrink-0 items-center justify-center rounded-full bg-mk-brand font-bold text-mk-brand-fg">
              {i + 1}
            </span>
            <div>
              <h3 className="mk-heading text-lg font-semibold">{s.title}</h3>
              <p className="mt-1 text-mk-muted">{s.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}