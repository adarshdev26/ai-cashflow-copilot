import { cx } from './cx';

type Props = {
    eyebrow?: string;
    title: string;
    subtitle?: string;
    align?: 'center' | 'left';
    as?: 'h1' | 'h2';
};

export function SectionHeader({
    eyebrow,
    title,
    subtitle,
    align = 'center',
    as: Tag = 'h2',
}: Props) {
    return (
        <div data-reveal className={cx('max-w-2xl', align === 'center' && 'mx-auto text-center')}>
            {eyebrow && (
                <p className="text-mk-brand mb-3 text-sm font-semibold tracking-wider uppercase">
                    {eyebrow}
                </p>
            )}
            <Tag className="mk-heading text-3xl font-bold sm:text-4xl lg:text-5xl">{title}</Tag>
            {subtitle && <p className="text-mk-muted mt-4 text-lg">{subtitle}</p>}
        </div>
    );
}
