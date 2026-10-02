import type { Metadata } from 'next';
import { Hero } from '@/components/marketing/sections/Hero';
import { FeatureGrid } from '@/components/marketing/sections/FeatureGrid';
import { FeatureBento } from '@/components/marketing/sections/FeatureBento';
import { FeatureSplit } from '@/components/marketing/sections/FeatureSplit';
import { StepsTimeline } from '@/components/marketing/sections/StepsTimeline';
import { Testimonials } from '@/components/marketing/sections/Testimonials';
import { PricingTable } from '@/components/marketing/sections/PricingTable';
import { FAQ } from '@/components/marketing/sections/FAQ';
import { CTABanner } from '@/components/marketing/sections/CTABanner';
import { FEATURES, STEPS, FAQS, pickDetails } from '@/content/marketing/features';
import { USE_CASES } from '@/content/marketing/pages';
import { plans } from '@/content/marketing/pricing';
import { testimonials } from '@/content/marketing/testimonials';
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
      // image={{ src: '/marketing/dashboard-light.png', srcDark: '/marketing/dashboard-light.png', alt: `${SITE.name} dashboard` }}
      />

      <FeatureGrid
        eyebrow="Who it's for"
        title="Built for how you actually live"
        subtitle="One simple tool for households, side projects, small teams, and anyone building better money habits."
        items={USE_CASES}
        columns={2}
        tone="muted"
      />

      <FeatureBento
        eyebrow="Features"
        title="Everything you need, nothing you don't"
        subtitle="Workspaces, a fast ledger, templates, clear numbers, habits, and notes, all in one place."
        items={FEATURES}
      />

      <FeatureSplit items={pickDetails(['workspaces', 'accounts', 'budgets', 'together'])} />

      <StepsTimeline eyebrow="How it works" title="Up and running in minutes" subtitle="Four simple steps from sign-up to a shared, organized view of your money." steps={STEPS} tone="muted" />

      <Testimonials title="Loved by people who share money." subtitle="What families, founders, and small teams say." testimonials={testimonials} />

      <PricingTable title="Simple plans that grow with you" subtitle="Start free. Upgrade when you need more workspaces or want to invite people." plans={plans} tone="muted" />

      <FAQ items={FAQS} />

      <CTABanner />
    </>
  );
}