import { Section } from '../primitives/Section';
import { SectionHeader } from '../primitives/SectionHeader';
import { Reveal } from '../primitives/Reveal';
import { cx } from '../primitives/cx';
import type { Feature } from '@/content/marketing/features';

type Props = { eyebrow?: string; title: string; subtitle?: string; items: Feature[] };

// Cards at these indexes span two columns on large screens
const WIDE = new Set([0, 3]);
const BARS = [30, 48, 40, 64, 52, 78, 60, 92];

export function FeatureBento({ eyebrow, title, subtitle, items }: Props) {
    return (
        <Section pattern="dots">
            <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />
            <div className="mt-14 grid gap-5 lg:grid-cols-3">
                {items.map(({ icon: Icon, title, description }, i) => {
                    const wide = WIDE.has(i);
                    return (
                        <Reveal
                            key={title}
                            variant="scale"
                            delay={(i % 3) * 80}
                            className={cx('h-full', wide && 'lg:col-span-2')}
                        >
                            <div className="mk-card border-mk-line bg-mk-surface/70 relative h-full overflow-hidden rounded-2xl border p-7 sm:p-9">
                                <div
                                    aria-hidden
                                    className="pointer-events-none absolute -top-16 -right-16 size-64 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--mk-brand)_20%,transparent),transparent)]"
                                />
                                {/* <Icon aria-hidden className="pointer-events-none absolute -bottom-8 -right-8 size-44 text-mk-brand/[0.07]" /> */}

                                <span className="border-mk-line bg-mk-bg text-mk-brand relative inline-flex size-12 items-center justify-center rounded-xl border">
                                    <Icon size={22} />
                                </span>
                                <h3 className="mk-heading relative mt-6 text-xl font-semibold">
                                    {title}
                                </h3>
                                <p className="text-mk-muted relative mt-2 max-w-md">
                                    {description}
                                </p>

                                {wide && (
                                    <div
                                        aria-hidden
                                        className="relative mt-8 flex h-20 items-end gap-2"
                                    >
                                        {BARS.map((h, j) => (
                                            <div
                                                key={j}
                                                className="from-mk-brand/10 to-mk-brand/60 flex-1 rounded-t bg-gradient-to-t"
                                                style={{ height: `${h}%` }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Reveal>
                    );
                })}
            </div>
        </Section>
    );
}
