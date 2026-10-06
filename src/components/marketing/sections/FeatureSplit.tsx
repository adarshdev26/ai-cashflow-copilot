import { Check } from 'lucide-react';
import { Section } from '../primitives/Section';
import { GridBackground } from '../primitives/GridBackground';
import { BrowserFrame, type Shot } from '../primitives/BrowserFrame';
import { Reveal } from '../primitives/Reveal';
import { cx } from '../primitives/cx';
import type { FeatureDetail } from '@/content/marketing/features';

export function FeatureSplit({
    items,
    images,
}: {
    items: FeatureDetail[];
    images?: (Shot | undefined)[];
}) {
    return (
        <Section className="space-y-24 sm:space-y-36">
            {items.map(({ icon: Icon, eyebrow, title, description, bullets, image }, i) => {
                const shot = image ?? images?.[i]; // item image wins, `images` prop still works
                const flip = i % 2 === 1;
                return (
                    <div key={title} className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
                        <Reveal
                            variant={flip ? 'right' : 'left'}
                            className={cx('lg:col-span-5', flip && 'lg:order-2')}
                        >
                            <span className="border-mk-line bg-mk-surface text-mk-brand inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-wider uppercase">
                                <Icon size={14} aria-hidden /> {eyebrow}
                            </span>
                            <h2 className="mk-heading mt-5 text-3xl font-bold sm:text-4xl">
                                {title}
                            </h2>
                            <p className="text-mk-muted mt-4 text-lg">{description}</p>
                            {shot && (
                                <ul className="mt-6 space-y-3">
                                    {bullets.map((b) => (
                                        <li key={b} className="flex items-start gap-3 text-sm">
                                            <Check
                                                size={18}
                                                className="text-mk-brand mt-0.5 shrink-0"
                                                aria-hidden
                                            />
                                            {b}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Reveal>

                        <Reveal
                            variant="scale"
                            delay={100}
                            className={cx('lg:col-span-7', flip && 'lg:order-1')}
                        >
                            {shot ? (
                                <BrowserFrame shot={shot} />
                            ) : (
                                <div className="border-mk-line bg-mk-surface relative isolate overflow-hidden rounded-2xl border p-5 sm:p-8">
                                    <GridBackground />
                                    <div className="mb-4 flex items-center gap-3">
                                        <span className="bg-mk-brand/15 text-mk-brand inline-flex size-9 items-center justify-center rounded-lg">
                                            <Icon size={18} />
                                        </span>
                                        <span className="text-sm font-semibold">{eyebrow}</span>
                                    </div>
                                    <ul className="space-y-2">
                                        {bullets.map((b) => (
                                            <li
                                                key={b}
                                                className="border-mk-line bg-mk-bg/80 flex items-center gap-3 rounded-lg border px-4 py-3 text-sm backdrop-blur"
                                            >
                                                <Check
                                                    size={16}
                                                    className="text-mk-brand shrink-0"
                                                />
                                                {b}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </Reveal>
                    </div>
                );
            })}
        </Section>
    );
}
