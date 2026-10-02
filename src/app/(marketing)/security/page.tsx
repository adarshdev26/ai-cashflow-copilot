import type { Metadata } from 'next';
import { Hero } from '@/components/marketing/sections/Hero';
import { FeatureGrid } from '@/components/marketing/sections/FeatureGrid';
import { FeatureSplit } from '@/components/marketing/sections/FeatureSplit';
import { StepsTimeline } from '@/components/marketing/sections/StepsTimeline';
import { FAQ } from '@/components/marketing/sections/FAQ';
import { CTABanner } from '@/components/marketing/sections/CTABanner';
import { SECURITY_POINTS } from '@/content/marketing/features';
import { SECURITY_DETAILS, INVITE_STEPS, SECURITY_PRACTICES, SECURITY_FAQS } from '@/content/marketing/pages';

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
        eyebrow="Security"
        title="Your finances stay yours"
        subtitle="Privacy and access control are built into how workspaces work."
        primary={{ href: '/signup', label: 'Get started' }}
        secondary={{ href: '/contact', label: 'Ask a question' }}
      />

      <FeatureGrid
        eyebrow="The basics"
        title="How we protect your workspace"
        subtitle="Four principles that shape how access works."
        items={SECURITY_POINTS}
        columns={2}
      />

      <FeatureSplit items={SECURITY_DETAILS} />

      <StepsTimeline
        eyebrow="Sharing"
        title="What happens when you invite someone"
        subtitle="Sharing is always deliberate and always limited to one workspace."
        steps={INVITE_STEPS}
        tone="muted"
      />

      <FeatureGrid
        eyebrow="Your part"
        title="Good habits on your side"
        subtitle="A few simple practices keep any account safer."
        items={SECURITY_PRACTICES}
        columns={2}
        pattern="dots"
      />

      <FAQ title="Security questions." items={SECURITY_FAQS} tone="muted" />

      <CTABanner title="Keep your money private and organized" subtitle="Create a workspace and invite only the people who should see it." />
    </>
  );
}