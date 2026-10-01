import type { Metadata } from 'next';
import { Section } from '@/components/marketing/primitives/Section';
import { SectionHeader } from '@/components/marketing/primitives/SectionHeader';
import { ContactForm } from '@/components/marketing/sections/ContactForm';
import { SITE } from '@/content/marketing/site';

export const metadata: Metadata = {
  title: 'Contact',
  description: `Questions or feedback? Get in touch with the ${SITE.name} team.`,
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <Section>
      <SectionHeader as="h1" title="Get in touch" subtitle="Questions, feedback or ideas? We read every message." />
      <div className="mx-auto mt-12 grid max-w-4xl gap-12 md:grid-cols-5">
        <div className="md:col-span-2">
          <p className="font-semibold">Email</p>
          <a href={`mailto:${SITE.email}`} className="text-mk-brand">{SITE.email}</a>
        </div>
        <div className="md:col-span-3">
          <ContactForm />
        </div>
      </div>
    </Section>
  );
}