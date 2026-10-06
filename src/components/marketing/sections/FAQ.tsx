import { Plus } from 'lucide-react';
import { Section } from '../primitives/Section';
import { SectionHeader } from '../primitives/SectionHeader';
import { CTAButton } from '../primitives/CTAButton';
import { Reveal } from '../primitives/Reveal';

type Props = {
    items: { q: string; a: string }[];
    title?: string;
    eyebrow?: string;
    subtitle?: string;
    tone?: 'default' | 'muted';
};

export function FAQ({
    items,
    title = 'Frequently asked questions',
    eyebrow = 'FAQ',
    subtitle = 'Can’t find what you need? Reach out and we’ll help.',
    tone = 'default',
}: Props) {
    return (
        <Section tone={tone}>
            <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
                <div className="self-start lg:sticky lg:top-28 lg:col-span-4">
                    <SectionHeader
                        eyebrow={eyebrow}
                        title={title}
                        subtitle={subtitle}
                        align="left"
                    />
                    <div data-reveal className="mt-6">
                        <CTAButton href="/contact" variant="secondary">
                            Contact us
                        </CTAButton>
                    </div>
                </div>

                <Reveal className="space-y-3 lg:col-span-8">
                    {items.map((f) => (
                        <details
                            key={f.q}
                            className="group border-mk-line bg-mk-surface/50 open:border-mk-brand/40 open:bg-mk-surface rounded-xl border p-5 transition"
                        >
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                                {f.q}
                                <span className="bg-mk-brand/10 text-mk-brand flex size-7 shrink-0 items-center justify-center rounded-full transition group-open:rotate-45">
                                    <Plus size={16} aria-hidden />
                                </span>
                            </summary>
                            <p className="text-mk-muted mt-3 max-w-2xl leading-relaxed">{f.a}</p>
                        </details>
                    ))}
                </Reveal>
            </div>
        </Section>
    );
}
