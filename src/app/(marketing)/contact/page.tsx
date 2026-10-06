import type { Metadata } from 'next';
import { connection } from 'next/server';
import Link from 'next/link';
import { Mail, LifeBuoy, MessageSquare, ShieldCheck } from 'lucide-react';
import { Hero } from '@/components/marketing/sections/Hero';
import { Section } from '@/components/marketing/primitives/Section';
import { Reveal } from '@/components/marketing/primitives/Reveal';
import { ContactForm } from '@/components/marketing/sections/ContactForm';
import { FAQ } from '@/components/marketing/sections/FAQ';
import { CTABanner } from '@/components/marketing/sections/CTABanner';
import { CONTACT_FAQS } from '@/content/marketing/pages';
import { SITE } from '@/content/marketing/site';
import { getSystemSettings } from '@/lib/settings/server';

export async function generateMetadata(): Promise<Metadata> {
    await connection();
    const settings = await getSystemSettings();
    const name = String(settings['branding.name'] ?? SITE.name);
    return {
        title: 'Contact',
        description: `Questions or feedback? Get in touch with the ${name} team.`,
        alternates: { canonical: '/contact' },
    };
}

export default async function ContactPage() {
    await connection();
    const settings = await getSystemSettings();
    const supportEmail = String(settings['branding.supportEmail'] ?? SITE.email);
    const channels = [
        {
            icon: Mail,
            title: 'Email us',
            body: 'Prefer your own inbox? Write to us directly.',
            href: `mailto:${supportEmail}`,
            label: supportEmail,
        },
        {
            icon: LifeBuoy,
            title: 'Account help',
            body: 'Include the email you signed up with and a short description of the issue.',
        },
        {
            icon: MessageSquare,
            title: 'Feedback and ideas',
            body: 'Tell us what would make it more useful for you. We read every message.',
        },
        {
            icon: ShieldCheck,
            title: 'Security concerns',
            body: 'Mention security in your message, or see how workspaces are protected.',
            href: '/security',
            label: 'Read about security',
        },
    ];
    return (
        <>
            <Hero
                compact
                eyebrow="Contact"
                title="Get in touch"
                subtitle="Questions, feedback or ideas? We read every message."
            />

            <Section>
                <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
                    <div className="space-y-4 lg:col-span-5">
                        {channels.map(({ icon: Icon, title, body, href, label }, i) => (
                            <Reveal key={title} delay={i * 80}>
                                <div className="mk-card border-mk-line bg-mk-surface/60 flex gap-4 rounded-2xl border p-5">
                                    <span className="from-mk-brand/25 to-mk-brand/5 text-mk-brand ring-mk-brand/20 inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ring-1">
                                        <Icon size={20} aria-hidden />
                                    </span>
                                    <div>
                                        <h2 className="mk-heading font-semibold">{title}</h2>
                                        <p className="text-mk-muted mt-1 text-sm">{body}</p>
                                        {href && (
                                            <Link
                                                href={href}
                                                className="text-mk-brand mt-2 inline-block text-sm font-semibold hover:underline"
                                            >
                                                {label}
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </Reveal>
                        ))}
                    </div>

                    <Reveal variant="right" className="lg:col-span-7">
                        <div className="border-mk-line bg-mk-surface rounded-2xl border p-6 shadow-xl shadow-black/10 sm:p-10">
                            <h2 className="mk-heading text-2xl font-bold">Send us a message</h2>
                            <p className="text-mk-muted mt-2 mb-6">
                                Fill in the form and we’ll reply by email.
                            </p>
                            <ContactForm />
                        </div>
                    </Reveal>
                </div>
            </Section>

            <FAQ title="Before you write." items={CONTACT_FAQS} tone="muted" />

            <CTABanner
                title="Rather just try it?"
                subtitle="Create a workspace and explore with the guided tour."
            />
        </>
    );
}
