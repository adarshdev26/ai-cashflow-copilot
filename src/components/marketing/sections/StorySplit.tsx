import { Section } from '../primitives/Section';
import { SectionHeader } from '../primitives/SectionHeader';
import { Reveal } from '../primitives/Reveal';
import { cx } from '../primitives/cx';

type Props = {
    eyebrow?: string;
    title: string;
    paragraphs: string[];
    aside: React.ReactNode; // BrowserFrame, value cards, stats…
    reverse?: boolean;
    tone?: 'default' | 'muted';
};

export function StorySplit({
    eyebrow,
    title,
    paragraphs,
    aside,
    reverse,
    tone = 'default',
}: Props) {
    return (
        <Section tone={tone}>
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
                <div className={cx(reverse && 'lg:order-2')}>
                    <SectionHeader as="h2" eyebrow={eyebrow} title={title} align="left" />
                    <Reveal className="text-mk-muted mt-6 space-y-4 text-lg leading-relaxed">
                        {paragraphs.map((p) => (
                            <p key={p}>{p}</p>
                        ))}
                    </Reveal>
                </div>
                <Reveal
                    variant={reverse ? 'left' : 'right'}
                    className={cx(reverse && 'lg:order-1')}
                >
                    {aside}
                </Reveal>
            </div>
        </Section>
    );
}
