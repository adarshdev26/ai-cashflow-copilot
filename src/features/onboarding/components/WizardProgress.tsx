import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

export function WizardProgress({
  steps,
  current,
}: {
  steps: readonly string[];
  /** zero-based index of the active step */
  current: number;
}) {
  return (
    <ol className="flex items-center" aria-label="Onboarding progress">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const isLast = i === steps.length - 1;

        return (
          <li
            key={label}
            className={cn('flex items-center', !isLast && 'flex-1')}
            aria-current={active ? 'step' : undefined}
          >
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
                  done && 'border-indigo-500 bg-indigo-500 text-white',
                  active && 'border-indigo-500 text-indigo-400',
                  !done && !active && 'border-gray-700 text-gray-500'
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className={cn('text-[11px]', active ? 'text-gray-200' : 'text-gray-500')}>
                {label}
              </span>
            </div>
            {!isLast && (
              <div className={cn('mx-2 mb-5 h-px flex-1', done ? 'bg-indigo-500' : 'bg-gray-800')} />
            )}
          </li>
        );
      })}
    </ol>
  );
}