import type { Metadata } from 'next';
import { Hero } from '@/components/marketing/sections/Hero';
import { StepsTimeline } from '@/components/marketing/sections/StepsTimeline';
import { FAQ } from '@/components/marketing/sections/FAQ';
import { CTABanner } from '@/components/marketing/sections/CTABanner';
import { STEPS, FAQS } from '@/content/marketing/features';

export const metadata: Metadata = {
  title: 'How it works',
  description: 'Create a workspace, add transactions, see your numbers, and invite people in four simple steps.',
  alternates: { canonical: '/how-it-works' },
};

export default function HowItWorksPage() {
  return (
    <>
      <Hero
        compact
        title="Four steps to clarity"
        subtitle="No setup marathon. A short onboarding, a guided tour, and you're tracking."
        primary={{ href: '/signup', label: 'Get started' }}
      />
      <StepsTimeline title="From sign-up to your first insight" steps={STEPS} />
      <FAQ items={FAQS} />
      <CTABanner />
    </>
  );
}