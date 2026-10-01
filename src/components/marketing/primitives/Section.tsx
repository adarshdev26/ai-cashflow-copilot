import { Container } from './Container';
import { GridBackground } from './GridBackground';
import { cx } from './cx';

type Props = {
  id?: string;
  tone?: 'default' | 'muted';
  pattern?: 'grid' | 'dots';
  className?: string;
  children: React.ReactNode;
};

const tones = { default: 'bg-mk-bg', muted: 'bg-mk-surface' };

export function Section({ id, tone = 'default', pattern, className, children }: Props) {
  return (
    <section id={id} className={cx('relative isolate overflow-hidden py-16 sm:py-24', tones[tone])}>
      {pattern && <GridBackground variant={pattern} />}
      <Container className={className}>{children}</Container>
    </section>
  );
}