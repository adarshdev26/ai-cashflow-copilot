import { cx } from './cx';

type Props = { variant?: 'grid' | 'dots'; glow?: boolean; className?: string };

export function GridBackground({ variant = 'grid', glow = true, className }: Props) {
    return (
        <div aria-hidden className={cx('pointer-events-none absolute inset-0 -z-10', className)}>
            <div className={cx('absolute inset-0', variant === 'grid' ? 'mk-grid' : 'mk-dots')} />
            {glow && (
                <div className="absolute inset-0 bg-[radial-gradient(55%_45%_at_50%_0%,color-mix(in_oklab,var(--mk-brand)_16%,transparent),transparent_70%)]" />
            )}
        </div>
    );
}
