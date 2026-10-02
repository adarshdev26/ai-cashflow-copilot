import { ShieldCheck, Sparkles, Users } from 'lucide-react';
import { Container } from '../primitives/Container';
import { CTAButton } from '../primitives/CTAButton';
import { GridBackground } from '../primitives/GridBackground';
import { Reveal } from '../primitives/Reveal';

const POINTS = [
  { icon: Sparkles, label: 'Free plan available' },
  { icon: Users, label: 'Invite-only sharing' },
  { icon: ShieldCheck, label: 'Guided tour included' },
];

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
        <Reveal variant="scale">
          <div className="relative isolate overflow-hidden rounded-3xl border border-mk-line bg-mk-surface px-6 py-16 text-center sm:px-12 sm:py-24">
            <div aria-hidden className="mk-aurora -z-10" />
            <GridBackground glow={false} className="opacity-70" />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-12 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-mk-brand/60 to-transparent"
            />

            <h2 className="mk-heading mx-auto max-w-3xl text-3xl font-bold sm:text-5xl">{title}</h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-mk-muted">{subtitle}</p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <CTAButton href="/signup" size="lg">Get started</CTAButton>
              <CTAButton href="/login" variant="secondary" size="lg">Log in</CTAButton>
            </div>

            <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-mk-muted">
              {POINTS.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2">
                  <Icon size={16} className="text-mk-brand" aria-hidden /> {label}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}