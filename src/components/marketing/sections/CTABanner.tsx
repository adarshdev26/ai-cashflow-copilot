import { Container } from '../primitives/Container';
import { CTAButton } from '../primitives/CTAButton';

export function CTABanner({
  title = 'Take control of your cash flow',
  subtitle = 'Create a workspace, add your first transaction and take the guided tour.',
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <section className="bg-mk-bg py-16 sm:py-24">
      <Container>
        <div className="relative isolate overflow-hidden rounded-3xl border border-mk-line bg-mk-surface px-6 py-14 text-center sm:px-12 sm:py-20">
          {/* soft glows, blended from the brand color into the dark surface */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_50%_0%,color-mix(in_oklab,var(--mk-brand)_28%,transparent),transparent_70%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(40%_50%_at_100%_100%,color-mix(in_oklab,var(--mk-brand)_14%,transparent),transparent_70%)]"
          />
          {/* hairline highlight along the top edge */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-12 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-mk-brand/60 to-transparent"
          />

          <h2 className="mk-heading mx-auto max-w-2xl text-3xl font-bold sm:text-4xl">{title}</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-mk-muted">{subtitle}</p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <CTAButton href="/signup" size="lg">Get started</CTAButton>
            <CTAButton href="/login" variant="secondary" size="lg">Log in</CTAButton>
          </div>
        </div>
      </Container>
    </section>
  );
}