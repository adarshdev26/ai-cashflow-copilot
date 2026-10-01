import Link from 'next/link';
import { cx } from './cx';

type Props = {
  href: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'inverse';
  size?: 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
};

const variants = {
  primary: 'bg-mk-brand text-mk-brand-fg hover:opacity-90',
  secondary: 'border border-mk-line bg-mk-bg text-mk-fg hover:bg-mk-surface',
  ghost: 'text-mk-fg hover:bg-mk-surface',
  inverse: 'bg-white text-mk-brand hover:bg-white/90',
};

export function CTAButton({ href, variant = 'primary', size = 'md', className, children }: Props) {
  return (
    <Link
      href={href}
      className={cx(
        'inline-flex items-center justify-center rounded-lg font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mk-brand',
        size === 'md' ? 'h-10 px-4 text-sm' : 'h-12 px-6 text-base',
        variants[variant],
        className,
      )}
    >
      {children}
    </Link>
  );
}