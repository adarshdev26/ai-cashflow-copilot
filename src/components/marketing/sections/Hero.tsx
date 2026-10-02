import { Sparkles } from 'lucide-react';
import { Container } from '../primitives/Container';
import { CTAButton } from '../primitives/CTAButton';
import { GridBackground } from '../primitives/GridBackground';
import { BrowserFrame, type Shot } from '../primitives/BrowserFrame';
import { HeroPreview } from './HeroPreview';

type Props = {
  eyebrow?: string;
  title: string;
  subtitle: string;
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string };
  showPreview?: boolean;
  compact?: boolean;
  image?: Shot; // real dashboard screenshot; falls back to the built-in mock
};

const d = (ms: number) => ({ '--mk-delay': `${ms}ms` }) as React.CSSProperties;

export function Hero({ eyebrow, title, subtitle, primary, secondary, showPreview, compact, image }: Props) {
  return (
    <section className="relative isolate overflow-hidden bg-mk-bg">
      <div aria-hidden className="mk-aurora -z-10" />
      <GridBackground glow={false} />

      <Container className={compact ? 'py-16 text-center sm:py-20' : 'pt-20 text-center sm:pt-28'}>
        {eyebrow && (
          <p
            style={d(0)}
            className="mk-enter mb-6 inline-flex items-center gap-2 rounded-full border border-mk-line bg-mk-surface/70 px-3.5 py-1.5 text-xs font-semibold backdrop-blur"
          >
            <Sparkles size={14} className="text-mk-brand" aria-hidden />
            {eyebrow}
          </p>
        )}

        <h1
          style={d(80)}
          className="mk-enter mk-heading mk-gradient-text mx-auto max-w-4xl text-4xl font-extrabold sm:text-6xl lg:text-7xl pb-2"
        >
          {title}
        </h1>
        <p style={d(160)} className="mk-enter mx-auto mt-6 max-w-2xl text-lg text-mk-muted sm:text-xl">
          {subtitle}
        </p>

        {(primary || secondary) && (
          <div style={d(240)} className="mk-enter mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {primary && <CTAButton href={primary.href} size="lg">{primary.label}</CTAButton>}
            {secondary && <CTAButton href={secondary.href} size="lg" variant="secondary">{secondary.label}</CTAButton>}
          </div>
        )}

        {showPreview && (
          <div style={d(360)} className="mk-enter relative mx-auto mt-16 max-w-6xl">
            <div
              aria-hidden
              className="absolute -inset-x-8 -top-8 bottom-0 -z-10 rounded-[2rem] bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklab,var(--mk-brand)_30%,transparent),transparent_70%)]"
            />
            <div className="mk-fade-bottom">
              <BrowserFrame shot={image} priority>
                <HeroPreview />
              </BrowserFrame>
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}