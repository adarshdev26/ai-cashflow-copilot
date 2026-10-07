import { cx } from './cx';

type Props = {
    as?: React.ElementType;
    variant?: 'up' | 'scale' | 'left' | 'right';
    delay?: number; // ms
    className?: string;
    children: React.ReactNode;
};

export function Reveal({ as: Tag = 'div', variant = 'up', delay = 0, className, children }: Props) {
    return (
        <Tag
            data-reveal={variant}
            style={delay ? ({ '--mk-delay': `${delay}ms` } as React.CSSProperties) : undefined}
            className={cx(className)}
        >
            {children}
        </Tag>
    );
}
