import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { LegalLayout } from '@/components/marketing/sections/LegalLayout';
import { Section } from '@/components/marketing/primitives/Section';
import { SectionHeader } from '@/components/marketing/primitives/SectionHeader';
import { Reveal } from '@/components/marketing/primitives/Reveal';

export const metadata: Metadata = {
    title: 'Terms of Service',
    alternates: { canonical: '/terms' },
};

const TOC = [
    ['agreement', 'Agreement'],
    ['account', 'Your account'],
    ['workspaces', 'Workspaces and members'],
    ['content', 'Your content'],
    ['plans', 'Plans and billing'],
    ['use', 'Acceptable use'],
    ['availability', 'Availability'],
    ['termination', 'Termination'],
    ['disclaimer', 'Disclaimer'],
    ['liability', 'Liability'],
    ['changes', 'Changes'],
    ['contact', 'Contact'],
] as const;

const RELATED = [
    { href: '/privacy', title: 'Privacy Policy', body: 'What we collect and why.' },
    { href: '/pricing', title: 'Pricing', body: 'Plans and what each includes.' },
    { href: '/contact', title: 'Contact us', body: 'Questions about these terms?' },
];

export default function TermsPage() {
    return (
        <>
            <LegalLayout title="Terms of Service" updated="TODO date">
                <nav aria-label="On this page" className="mt-8 flex flex-wrap gap-2">
                    {TOC.map(([id, label]) => (
                        <a
                            key={id}
                            href={`#${id}`}
                            className="border-mk-line bg-mk-surface text-mk-muted hover:text-mk-fg rounded-full border px-3 py-1.5 text-sm transition"
                        >
                            {label}
                        </a>
                    ))}
                </nav>

                <h2 id="agreement" className="scroll-mt-24">
                    1. Agreement
                </h2>
                <p>
                    By creating an account or using the service you agree to these terms. If you do
                    not agree, please do not use it.
                </p>

                <h2 id="account" className="scroll-mt-24">
                    2. Your account
                </h2>
                <p>
                    You are responsible for your account, for keeping your login details safe, and
                    for activity that happens under it. TODO: eligibility and minimum age.
                </p>

                <h2 id="workspaces" className="scroll-mt-24">
                    3. Workspaces and members
                </h2>
                <p>
                    Workspace members can manage invitations and access from settings, and anyone
                    invited to a workspace can see its contents. Invite only people you trust.
                </p>

                <h2 id="content" className="scroll-mt-24">
                    4. Your content
                </h2>
                <p>
                    You keep ownership of the transactions, habits, and notes you add. You give us
                    permission to store and process them only to provide the service. TODO: confirm
                    with counsel.
                </p>

                <h2 id="plans" className="scroll-mt-24">
                    5. Plans and billing
                </h2>
                <p>
                    Free and paid plans have different limits, as described on the pricing page.
                    TODO: billing cycle, renewals, cancellation, refunds, and what happens to data
                    when you downgrade.
                </p>

                <h2 id="use" className="scroll-mt-24">
                    6. Acceptable use
                </h2>
                <ul>
                    <li>No unlawful, abusive, or fraudulent use of the service.</li>
                    <li>No attempts to access workspaces or data you are not invited to.</li>
                    <li>No interfering with the service or other people’s use of it.</li>
                </ul>

                <h2 id="availability" className="scroll-mt-24">
                    7. Availability and changes to the service
                </h2>
                <p>
                    We work to keep the service available, but it may occasionally be unavailable or
                    change over time. TODO.
                </p>

                <h2 id="termination" className="scroll-mt-24">
                    8. Termination
                </h2>
                <p>
                    You can stop using the service at any time. We may suspend accounts that break
                    these terms. TODO: data export and deletion on termination.
                </p>

                <h2 id="disclaimer" className="scroll-mt-24">
                    9. Disclaimer
                </h2>
                <p>
                    The service helps you track your finances and is not financial, tax or legal
                    advice.
                </p>

                <h2 id="liability" className="scroll-mt-24">
                    10. Limitation of liability
                </h2>
                <p>
                    TODO: add the limitation of liability and governing law that apply to you,
                    reviewed by counsel.
                </p>

                <h2 id="changes" className="scroll-mt-24">
                    11. Changes to these terms
                </h2>
                <p>We may update these terms and will note the date at the top of the page.</p>

                <h2 id="contact" className="scroll-mt-24">
                    12. Contact
                </h2>
                <p>Questions about these terms? Use the contact page.</p>
            </LegalLayout>

            <Section tone="muted">
                <SectionHeader eyebrow="Related" title="More about how we work" />
                <div className="mt-10 grid gap-4 sm:grid-cols-3">
                    {RELATED.map((r, i) => (
                        <Reveal key={r.href} delay={i * 80}>
                            <Link
                                href={r.href}
                                className="mk-card group border-mk-line bg-mk-bg flex h-full items-start justify-between gap-4 rounded-2xl border p-6"
                            >
                                <span>
                                    <span className="mk-heading block font-semibold">
                                        {r.title}
                                    </span>
                                    <span className="text-mk-muted mt-1 block text-sm">
                                        {r.body}
                                    </span>
                                </span>
                                <ArrowUpRight
                                    size={18}
                                    className="text-mk-brand shrink-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                                    aria-hidden
                                />
                            </Link>
                        </Reveal>
                    ))}
                </div>
            </Section>
        </>
    );
}
