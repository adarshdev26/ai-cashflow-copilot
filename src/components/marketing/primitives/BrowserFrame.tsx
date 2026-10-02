import Image from 'next/image';
import { cx } from './cx';

export type Shot = { src: string; srcDark?: string; alt: string };

type Props = {
  shot?: Shot;
  url?: string;
  priority?: boolean;
  className?: string;
  children?: React.ReactNode; // fallback content when there is no screenshot
};

const SIZES = '(min-width: 1280px) 1100px, (min-width: 1024px) 70vw, 100vw';

export function BrowserFrame({ shot, url = 'cashflowcopilot.com/app', priority, className, children }: Props) {
  return (
    <div
      className={cx(
        'relative rounded-2xl border border-mk-line bg-mk-surface/80 p-1.5 shadow-2xl shadow-black/25 backdrop-blur sm:p-2',
        className,
      )}
    >
      <div className="overflow-hidden rounded-xl border border-mk-line bg-mk-bg">
        <div className="flex items-center gap-3 border-b border-mk-line bg-mk-surface px-3 py-2.5">
          <span aria-hidden className="flex gap-1.5">
            <i className="size-2.5 rounded-full bg-rose-400/80" />
            <i className="size-2.5 rounded-full bg-amber-400/80" />
            <i className="size-2.5 rounded-full bg-emerald-400/80" />
          </span>
          <span className="mx-auto hidden h-6 w-full max-w-xs items-center justify-center rounded-md bg-mk-bg text-xs text-mk-muted sm:flex">
            {url}
          </span>
        </div>

        {shot ? (
          <div className="relative aspect-[16/10] w-full">
            <Image
              src={shot.src}
              alt={shot.alt}
              fill
              sizes={SIZES}
              priority={priority}
              className={cx('object-cover object-top', shot.srcDark && 'mk-img-light')}
            />
            {shot.srcDark && (
              <Image
                src={shot.srcDark}
                alt=""
                aria-hidden
                fill
                sizes={SIZES}
                priority={priority}
                className="mk-img-dark object-cover object-top"
              />
            )}
          </div>
        ) : (
          children ?? (
            <div className="flex aspect-[16/10] w-full items-center justify-center text-sm text-mk-muted">
              Dashboard screenshot goes here
            </div>
          )
        )}
      </div>
    </div>
  );
}