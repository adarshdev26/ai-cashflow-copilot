import type { Metadata } from 'next';
import { Hero } from '@/components/marketing/sections/Hero';
import { Section } from '@/components/marketing/primitives/Section';
import { SectionHeader } from '@/components/marketing/primitives/SectionHeader';
import { FeatureGrid } from '@/components/marketing/sections/FeatureGrid';
import { CTABanner } from '@/components/marketing/sections/CTABanner';
import { VALUES } from '@/content/marketing/features';
import { SITE } from '@/content/marketing/site';

export const metadata: Metadata = {
  title: 'About',
  description: `Why we built ${SITE.name}: a simpler, shared way to handle everyday money.`,
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <>
      <Hero
        compact
        title="Money is better when it's shared and simple"
        subtitle={`${SITE.name} exists to make everyday money tracking clear for individuals, families and small teams.`}
      />
      <Section>
        <SectionHeader align="left" eyebrow="Our story" title="Why we built this" />
        {/* TODO: replace with your real story */}
        <div className="mt-6 max-w-2xl space-y-4 text-lg text-mk-muted">
          <p>Most money tools are either spreadsheets that break or heavy apps built for accountants.</p>
          <p>
            We wanted something in between: quick to fill, easy to read, and shareable with the people you
            actually split life with, with habits and notes beside the numbers.
          </p>
        </div>
      </Section>
      <FeatureGrid eyebrow="Values" title="What we care about" items={VALUES} tone="muted" />
      <CTABanner />
    </>
  );
}