import type { Metadata } from 'next';
import { Hero } from '@/components/marketing/sections/Hero';
import { FeatureGrid } from '@/components/marketing/sections/FeatureGrid';
import { FeatureSplit } from '@/components/marketing/sections/FeatureSplit';
import { StepsTimeline } from '@/components/marketing/sections/StepsTimeline';
import { FAQ } from '@/components/marketing/sections/FAQ';
import { CTABanner } from '@/components/marketing/sections/CTABanner';
import { FEATURES, FEATURE_DETAILS, STEPS, FAQS } from '@/content/marketing/features';
import { SITE } from '@/content/marketing/site';

export const metadata: Metadata = {
  title: { absolute: `${SITE.name}: ${SITE.tagline}` },
  description: SITE.description,
  alternates: { canonical: '/' },
};

export default function HomePage() {
  return (
    <>
      <Hero
        eyebrow="Shared workspaces for your money"
        title="Know where your money goes. Together."
        subtitle="Track income and expenses, keep every part of your life in its own workspace, and build the habits that keep you on track."
        primary={{ href: '/signup', label: 'Get started' }}
        secondary={{ href: '/features', label: 'See features' }}
        showPreview
      />
      <FeatureGrid
        eyebrow="Features"
        title="Everything you need, nothing you don't"
        subtitle="Simple tools for tracking money, habits and notes in one place."
        items={FEATURES}
      />
      <FeatureSplit items={FEATURE_DETAILS.slice(0, 3)}  />
      <StepsTimeline eyebrow="How it works" title="Up and running in minutes" steps={STEPS} tone="default" />
      <FAQ items={FAQS} />
      <CTABanner />
    </>
  );
}