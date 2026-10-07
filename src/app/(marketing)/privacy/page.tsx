import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { LegalLayout } from '@/components/marketing/sections/LegalLayout';
import { Section } from '@/components/marketing/primitives/Section';
import { SectionHeader } from '@/components/marketing/primitives/SectionHeader';
import { Reveal } from '@/components/marketing/primitives/Reveal';

export const metadata: Metadata = {
    title: 'Privacy Policy',
    alternates: { canonical: '/privacy' },
};

const TOC = [
    ['summary', 'Summary'],
    ['collect', 'Information we collect'],
    ['use', 'How we use it'],
    ['workspaces', 'Workspaces'],
    ['providers', 'Service providers'],
    ['storage', 'Local storage'],
    ['retention', 'Retention'],
    ['security', 'Security'],
    ['choices', 'Your choices'],
    ['children', 'Children'],
    ['changes', 'Changes'],
    ['contact', 'Contact'],
] as const;

const RELATED = [
    { href: '/terms', title: 'Terms of Service', body: 'The rules for using the service.' },
    { href: '/security', title: 'Security', body: 'How workspace access works.' },
    { href: '/contact', title: 'Contact us', body: 'Questions about your data?' },
];

export default function PrivacyPage() {
    return (
        <>
            <LegalLayout title="Privacy Policy" updated="TODO date">
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

                <h2 id="summary" className="scroll-mt-24">
                    1. Summary
                </h2>
                <p>
                    We collect only what we need to run the service: your account details and the
                    transactions you add. Data in a workspace is visible to that workspace’s members
                    and nobody else.
                </p>

                <h2 id="collect" className="scroll-mt-24">
                    2. Information we collect
                </h2>
                <ul>
                    <li>Account details such as your name and email address.</li>
                    <li>Content you add to a workspace: transactions.</li>
                    <li>Invitation details, such as the email addresses you invite.</li>
                    <li>
                        Basic usage and device data needed to keep the service reliable. TODO: list
                        exactly.
                    </li>
                </ul>

                <h2 id="use" className="scroll-mt-24">
                    3. How we use it
                </h2>
                <ul>
                    <li>To provide, maintain, and improve the service.</li>
                    <li>To keep accounts and workspaces secure.</li>
                    <li>To contact you about your account, invitations, and important changes.</li>
                </ul>

                <h2 id="workspaces" className="scroll-mt-24">
                    4. Sharing within workspaces
                </h2>
                <p>
                    Data in a workspace is visible to its members. People join a workspace by
                    invitation, and workspace members can manage access from settings. Other
                    workspaces you belong to stay separate.
                </p>

                <h2 id="providers" className="scroll-mt-24">
                    5. Service providers
                </h2>
                <p>
                    We may use third-party providers to host the service, send email, or process
                    payments. TODO: name categories and providers.
                </p>

                <h2 id="storage" className="scroll-mt-24">
                    6. Cookies and local storage
                </h2>
                <p>
                    We use a session to keep you signed in. On the marketing pages, your light or
                    dark theme choice is remembered in your browser’s local storage. TODO: confirm
                    any analytics or other cookies.
                </p>

                <h2 id="retention" className="scroll-mt-24">
                    7. Retention and deletion
                </h2>
                <p>
                    We keep your data while your account is active. TODO: describe how long data is
                    kept after deletion and how to request it.
                </p>

                <h2 id="security" className="scroll-mt-24">
                    8. Security
                </h2>
                <p>
                    Dashboard requests require a valid session, and workspace data is only shown to
                    its members. No online service can promise perfect security, so please also use
                    a unique password.
                </p>

                <h2 id="choices" className="scroll-mt-24">
                    9. Your choices
                </h2>
                <ul>
                    <li>Access or correct your account details.</li>
                    <li>Manage members and invitations from workspace settings.</li>
                    <li>
                        Ask us to export or delete your data. TODO: describe the process and
                        applicable rights.
                    </li>
                </ul>

                <h2 id="children" className="scroll-mt-24">
                    10. Children
                </h2>
                <p>The service is not intended for children. TODO: state the minimum age.</p>

                <h2 id="changes" className="scroll-mt-24">
                    11. Changes to this policy
                </h2>
                <p>We may update this policy and will note the date at the top of the page.</p>

                <h2 id="contact" className="scroll-mt-24">
                    12. Contact
                </h2>
                <p>Questions about this policy? Use the contact page and we’ll get back to you.</p>
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
