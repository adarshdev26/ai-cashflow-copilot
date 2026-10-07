import type { Metadata } from 'next';
import { Hero } from '@/components/marketing/sections/Hero';
import { FeatureBento } from '@/components/marketing/sections/FeatureBento';
import { FeatureSplit } from '@/components/marketing/sections/FeatureSplit';
import { FeatureGrid } from '@/components/marketing/sections/FeatureGrid';
import { ComparisonTable } from '@/components/marketing/sections/ComparisonTable';
import { FAQ } from '@/components/marketing/sections/FAQ';
import { CTABanner } from '@/components/marketing/sections/CTABanner';
import { FEATURES, FEATURE_DETAILS, EXTRAS, FAQS } from '@/content/marketing/features';
import { comparisonRows } from '@/content/marketing/pricing';

export const metadata: Metadata = {
    title: 'Features',
    description:
        'Workspaces, accounts, transactions, templates, recurring entries, categories, budgets and shared access, all in one place.',
    alternates: { canonical: '/features' },
};

export default function FeaturesPage() {
    return (
        <>
            <Hero
                compact
                eyebrow="Features"
                title="Features built for everyday money"
                subtitle="From the first transaction to a shared household workspace, here is everything you get."
                primary={{ href: '/signup', label: 'Get started' }}
                secondary={{ href: '/pricing', label: 'See pricing' }}
            />

            <FeatureBento
                eyebrow="At a glance"
                title="The whole toolkit"
                subtitle="Building blocks that work together, so money never live in separate apps."
                items={FEATURES}
            />

            <FeatureSplit items={FEATURE_DETAILS} />

            <FeatureGrid
                eyebrow="And more"
                title="Small things that add up"
                subtitle="The details that make daily use feel easy."
                items={EXTRAS}
                tone="muted"
            />

            <ComparisonTable
                title="Which features come with which plan."
                subtitle="Every plan includes the essentials. Upgrade for more workspaces, sharing, and templates."
                rows={comparisonRows}
                tone="default"
            />

            <FAQ title="Feature questions." items={FAQS} tone="muted" />

            <CTABanner />
        </>
    );
}
