import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Hero } from '@/components/marketing/sections/Hero';
import { FeatureGrid } from '@/components/marketing/sections/FeatureGrid';
import { FeatureBento } from '@/components/marketing/sections/FeatureBento';
import { FeatureSplit } from '@/components/marketing/sections/FeatureSplit';
import { StepsTimeline } from '@/components/marketing/sections/StepsTimeline';
//import { Testimonials } from '@/components/marketing/sections/Testimonials';
import { PricingTable } from '@/components/marketing/sections/PricingTable';
import { FAQ } from '@/components/marketing/sections/FAQ';
import { CTABanner } from '@/components/marketing/sections/CTABanner';
import { FEATURES, STEPS, FAQS, pickDetails } from '@/content/marketing/features';
import { USE_CASES } from '@/content/marketing/pages';
import { plans } from '@/content/marketing/pricing';
import { testimonials } from '@/content/marketing/testimonials';
import { SITE } from '@/content/marketing/site';
import { getSystemSettings } from '@/lib/settings/server';

export async function generateMetadata(): Promise<Metadata> {
    await connection();
    const settings = await getSystemSettings();
    const name = String(settings['branding.name'] ?? SITE.name);
    const tagline = String(settings['branding.tagline'] ?? SITE.tagline);
    const description = String(settings['branding.description'] ?? SITE.description);
    return {
        title: { absolute: `${name}: ${tagline}` },
        description,
        alternates: { canonical: '/' },
    };
}

export default function HomePage() {
    return (
        <>
            <Hero
                eyebrow="Shared workspaces for your money"
                title="Know where your money goes. Together."
                subtitle="Track income and expenses and keep every part of your life in its own workspace."
                primary={{ href: '/signup', label: 'Get started' }}
                secondary={{ href: '/features', label: 'See features' }}
                showPreview
                // image={{ src: '/marketing/dashboard-light.png', srcDark: '/marketing/dashboard-light.png', alt: `${SITE.name} dashboard` }}
            />

            <FeatureGrid
                eyebrow="Who it's for"
                title="Built for how you actually live"
                subtitle="One simple tool for households, side projects, small teams, and anyone who wants a clearer view of their money."
                items={USE_CASES}
                columns={2}
                tone="muted"
            />

            <FeatureBento
                eyebrow="Features"
                title="Everything you need, nothing you don't"
                subtitle="Workspaces, a fast ledger, templates, and clear numbers, all in one place."
                items={FEATURES}
            />

            <FeatureSplit items={pickDetails(['workspaces', 'accounts', 'budgets', 'together'])} />

            <StepsTimeline
                eyebrow="How it works"
                title="Up and running in minutes"
                subtitle="Four simple steps from sign-up to a shared, organized view of your money."
                steps={STEPS}
                tone="muted"
            />

            {/* <Testimonials
                title="Loved by people who share money."
                subtitle="What families, founders, and small teams say."
                testimonials={testimonials}
            /> */}

            <PricingTable
                title="Simple plans that grow with you"
                subtitle="Start free. Upgrade when you need more workspaces or want to invite people."
                plans={plans}
                tone="muted"
            />

            <FAQ items={FAQS} />

            <CTABanner />
        </>
    );
}
