import type { Metadata } from 'next';
import { Hero } from '@/components/marketing/sections/Hero';
import { FeatureGrid } from '@/components/marketing/sections/FeatureGrid';
import { CTABanner } from '@/components/marketing/sections/CTABanner';
import { SECURITY_POINTS } from '@/content/marketing/features';

export const metadata: Metadata = {
  title: 'Security',
  description: 'How we keep your workspaces private: authenticated access, invite-only membership and separated data.',
  alternates: { canonical: '/security' },
};

export default function SecurityPage() {
  return (
    <>
      <Hero
        compact
        title="Your finances stay yours"
        subtitle="Privacy and access control are built into how workspaces work."
      />
      <FeatureGrid title="How we protect your workspace" items={SECURITY_POINTS} columns={2} />
      <CTABanner />
    </>
  );
}