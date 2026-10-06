import type { Metadata } from 'next';
import { Hero } from '@/components/marketing/sections/Hero';
import { StepsTimeline } from '@/components/marketing/sections/StepsTimeline';
import { FeatureGrid } from '@/components/marketing/sections/FeatureGrid';
import { FeatureSplit } from '@/components/marketing/sections/FeatureSplit';
import { FAQ } from '@/components/marketing/sections/FAQ';
import { CTABanner } from '@/components/marketing/sections/CTABanner';
import { STEPS, pickDetails } from '@/content/marketing/features';
import { ONBOARDING, WEEKLY_RHYTHM, HOW_FAQS } from '@/content/marketing/pages';

export const metadata: Metadata = {
    title: 'How it works',
    description:
        'Create a workspace, add transactions, see your numbers, and invite people in four simple steps.',
    alternates: { canonical: '/how-it-works' },
};

export default function HowItWorksPage() {
    return (
        <>
            <Hero
                compact
                eyebrow="How it works"
                title="Four steps to clarity"
                subtitle="No setup marathon. A short onboarding, a guided tour, and you're tracking."
                primary={{ href: '/signup', label: 'Get started' }}
                secondary={{ href: '/features', label: 'See features' }}
            />

            <StepsTimeline
                title="From sign-up to your first insight"
                subtitle="The whole journey on one screen."
                steps={STEPS}
                tone="muted"
            />

            <FeatureGrid
                eyebrow="Your first session"
                title="What you'll do on day one"
                subtitle="A simple checklist to get a workspace set up the way you like."
                items={ONBOARDING}
                pattern="dots"
            />

            <FeatureSplit items={pickDetails(['workspaces', 'together'])} />

            <FeatureGrid
                eyebrow="Day to day"
                title="A weekly rhythm that sticks"
                subtitle="Small routines that keep your numbers, habits, and notes working together."
                items={WEEKLY_RHYTHM}
                tone="muted"
            />

            <FAQ title="Getting started." items={HOW_FAQS} />

            <CTABanner
                title="Ready to set up your first workspace?"
                subtitle="Create an account and be tracking in minutes."
            />
        </>
    );
}
