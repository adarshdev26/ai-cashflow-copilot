import { Section } from '../primitives/Section';
import { SectionHeader } from '../primitives/SectionHeader';
import { BrowserFrame, type Shot } from '../primitives/BrowserFrame';
import { Reveal } from '../primitives/Reveal';

type Props = { eyebrow?: string; title: string; subtitle?: string; shot?: Shot };

export function ProductShowcase({ eyebrow = 'The product', title, subtitle, shot }: Props) {
  return (
    <Section tone="muted" pattern="dots">
      <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <Reveal variant="scale" className="relative mt-14">
        <div
          aria-hidden
          className="absolute -inset-6 -z-10 rounded-[2rem] bg-[radial-gradient(50%_60%_at_50%_50%,color-mix(in_oklab,var(--mk-brand)_22%,transparent),transparent_70%)]"
        />
        <BrowserFrame shot={shot} />
      </Reveal>
    </Section>
  );
}