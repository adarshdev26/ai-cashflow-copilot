import type { Metadata } from 'next';
import { Hero } from '@/components/marketing/sections/Hero';
import { FeatureSplit } from '@/components/marketing/sections/FeatureSplit';
import { FeatureGrid } from '@/components/marketing/sections/FeatureGrid';
import { CTABanner } from '@/components/marketing/sections/CTABanner';
import { FEATURE_DETAILS, EXTRAS } from '@/content/marketing/features';

export const metadata: Metadata = {
  title: 'Features',
  description: 'Workspaces, transactions, templates, habits, notes and shared access, all in one place.',
  alternates: { canonical: '/features' },
};

export default function FeaturesPage() {
  return (
    <>
      <Hero
        compact
        title="Features built for everyday money"
        subtitle="From the first transaction to a shared household workspace, here is what you get."
        primary={{ href: '/signup', label: 'Get started' }}
      />
      <FeatureSplit items={FEATURE_DETAILS} />
      <FeatureGrid eyebrow="And more" title="Small things that add up" items={EXTRAS} tone="muted" />
      <CTABanner />
    </>
  );
}