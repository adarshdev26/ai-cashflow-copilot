import { Container } from '../../../components/marketing/primitives/Container';
import { CTAButton } from '../../../components/marketing/primitives/CTAButton';
import { HeroPreview } from './HeroPreview';
import { GridBackground } from '../primitives/GridBackground';

type Props = {
  eyebrow?: string;
  title: string;
  subtitle: string;
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string };
  showPreview?: boolean;
  compact?: boolean;
};

export function Hero({ eyebrow, title, subtitle, primary, secondary, showPreview, compact }: Props) {
  return (
    <section className="relative isolate overflow-hidden bg-mk-bg">
      <GridBackground />
      <Container className={compact ? 'py-16 text-center sm:py-20' : 'py-20 text-center sm:py-28'}>
        {eyebrow && (
          <p className="mb-4 inline-block rounded-full border border-mk-line bg-mk-bg px-3 py-1 text-xs font-semibold text-mk-brand">
            {eyebrow}
          </p>
        )}
        <h1 className="mk-heading mx-auto max-w-3xl text-4xl font-extrabold sm:text-6xl">{title}</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-mk-muted sm:text-xl">{subtitle}</p>
        {(primary || secondary) && (
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {primary && <CTAButton href={primary.href} size="lg">{primary.label}</CTAButton>}
            {secondary && <CTAButton href={secondary.href} size="lg" variant="secondary">{secondary.label}</CTAButton>}
          </div>
        )}
        {showPreview && <HeroPreview />}
      </Container>
    </section>
  );
}