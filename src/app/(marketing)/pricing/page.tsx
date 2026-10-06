import type { Metadata } from 'next';
import { Hero } from '@/components/marketing/sections/Hero';
import { PricingTable } from '@/components/marketing/sections/PricingTable';
import { FeatureGrid } from '@/components/marketing/sections/FeatureGrid';
import { ComparisonTable } from '@/components/marketing/sections/ComparisonTable';
import { Testimonials } from '@/components/marketing/sections/Testimonials';
import { FAQ } from '@/components/marketing/sections/FAQ';
import { CTABanner } from '@/components/marketing/sections/CTABanner';
import { plans, comparisonRows } from '@/content/marketing/pricing';
import { pricingFaqs } from '@/content/marketing/faqs';
import { testimonials } from '@/content/marketing/testimonials';
import { INCLUDED_EVERYWHERE, PLAN_FIT } from '@/content/marketing/pages';

export const metadata: Metadata = {
    title: 'Pricing',
    description: 'Simple, transparent pricing for teams of every size.',
    alternates: { canonical: '/pricing' },
};

export default function PricingPage() {
    return (
        <>
            <Hero
                compact
                eyebrow="Pricing"
                title="Pricing that scales with you."
                subtitle="Start free. Upgrade when you're ready. Cancel anytime."
            />

            <PricingTable title="Plans for every stage." plans={plans} />

            <FeatureGrid
                eyebrow="Every plan"
                title="The essentials are always included"
                subtitle="No paywall on the basics of tracking your money."
                items={INCLUDED_EVERYWHERE}
                columns={2}
                tone="muted"
            />

            <ComparisonTable
                title="Compare plans in detail."
                rows={comparisonRows}
                tone="default"
            />

            <FeatureGrid
                eyebrow="Choosing"
                title="Which plan fits you?"
                subtitle="A quick way to pick, and you can change later."
                items={PLAN_FIT}
                tone="muted"
                pattern="dots"
            />

            <Testimonials title="What teams say." testimonials={testimonials} />

            <FAQ title="Billing questions." items={pricingFaqs} tone="muted" />

            <CTABanner />
        </>
    );
}
