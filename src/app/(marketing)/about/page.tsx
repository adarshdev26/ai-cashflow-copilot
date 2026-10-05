import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Hero } from '@/components/marketing/sections/Hero';
import { StorySplit } from '@/components/marketing/sections/StorySplit';
import { FeatureGrid } from '@/components/marketing/sections/FeatureGrid';
import { Testimonials } from '@/components/marketing/sections/Testimonials';
import { FAQ } from '@/components/marketing/sections/FAQ';
import { CTABanner } from '@/components/marketing/sections/CTABanner';
import { VALUES, EXTRAS } from '@/content/marketing/features';
import { USE_CASES, ABOUT_FAQS } from '@/content/marketing/pages';
import { testimonials } from '@/content/marketing/testimonials';
import { SITE } from '@/content/marketing/site';
import { getSystemSettings } from '@/lib/settings/server';

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  const settings = await getSystemSettings();
  const name = String(settings['branding.name'] ?? SITE.name);
  return { title: 'About', description: `Why we built ${name}: a simpler, shared way to handle everyday money.`, alternates: { canonical: '/about' } };
}

function IconCard({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="mk-card flex gap-4 rounded-2xl border border-mk-line bg-mk-surface/60 p-5">
      <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-mk-brand/25 to-mk-brand/5 text-mk-brand ring-1 ring-mk-brand/20">
        <Icon size={20} aria-hidden />
      </span>
      <div>
        <h3 className="mk-heading font-semibold">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-mk-muted">{description}</p>
      </div>
    </div>
  );
}

export default async function AboutPage() {
  await connection();
  const settings = await getSystemSettings();
  const siteName = String(settings['branding.name'] ?? SITE.name);
  return (
    <>
      <Hero
        compact
        eyebrow="About"
        title="Money is better when it's shared and simple"
        subtitle={`${siteName} exists to make everyday money tracking clear for individuals, families and small teams.`}
        primary={{ href: '/signup', label: 'Get started' }}
        secondary={{ href: '/contact', label: 'Get in touch' }}
      />

      {/* TODO: replace the copy with your real story */}
      <StorySplit
        eyebrow="Our story"
        title="Why we built this"
        paragraphs={[
          'Most money tools are either spreadsheets that break or heavy apps built for accountants.',
          'We wanted something in between: quick to fill, easy to read, and shareable with the people you actually split life with, with habits and notes beside the numbers.',
        ]}
        aside={
          <div className="space-y-4">
            {VALUES.map((v) => (
              <IconCard key={v.title} {...v} icon={v.icon} />
            ))}
          </div>
        }
      />

      <FeatureGrid
        eyebrow="Who it's for"
        title="Made for real-life money"
        subtitle="Whether you are managing a household or a tiny team, the idea is the same: keep it clear."
        items={USE_CASES}
        columns={2}
        tone="muted"
      />

      <StorySplit
        reverse
        eyebrow="Our approach"
        title="Built to be shared"
        paragraphs={[
          'Money is rarely a solo activity, so sharing, inviting, and collaborating are part of the core experience rather than an afterthought.',
          'Every workspace keeps its own transactions, members, habits, and notes, so you can share exactly what you want and nothing else.',
        ]}
        aside={
          <div className="space-y-4">
            {EXTRAS.map((e) => (
              <IconCard key={e.title} {...e} icon={e.icon} />
            ))}
          </div>
        }
      />

      <Testimonials title="What people say." testimonials={testimonials} tone="muted" />

      <FAQ title="About us." items={ABOUT_FAQS} />

      <CTABanner title="Try a simpler way to handle money" subtitle="Create a workspace, add your first transaction, and see how it feels." />
    </>
  );
}