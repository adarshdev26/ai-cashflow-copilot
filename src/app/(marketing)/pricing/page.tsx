import type { Metadata } from "next";
import { Hero } from "@/components/marketing/sections/Hero"; // was HeroPreview
import { PricingTable } from "@/components/marketing/sections/PricingTable";
import { ComparisonTable } from "@/components/marketing/sections/ComparisonTable";
import { Testimonials } from "@/components/marketing/sections/Testimonials";
import { FAQ } from "@/components/marketing/sections/FAQ";
import { CTABanner } from "@/components/marketing/sections/CTABanner";
import { plans, comparisonRows } from "@/content/marketing/pricing";
import { pricingFaqs } from "@/content/marketing/faqs";
import { testimonials } from "@/content/marketing/testimonials";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing for teams of every size.",
  alternates: { canonical: "/pricing" },
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

      <ComparisonTable title="Compare plans in detail." rows={comparisonRows} />

      <Testimonials title="What teams say." testimonials={testimonials} />

      <FAQ title="Billing questions." items={pricingFaqs} />

      <CTABanner />
    </>
  );
}