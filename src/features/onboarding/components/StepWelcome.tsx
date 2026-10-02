'use client';

import { useRouter } from 'next/navigation';
import { PrimaryButton } from '@/components/ui/Button';
import { notify, getErrorMessage } from '@/lib/toast';
import { useCompleteOnboarding } from '../hooks/use-onboarding';

export function StepWelcome({ onNext }: { onNext: () => void }) {
  const router = useRouter();
  const complete = useCompleteOnboarding();

  const handleSkip = async () => {
    if (complete.isPending) return;
    try {
      await complete.mutateAsync();
      router.replace('/dashboard');
    } catch (err) {
      notify.error(getErrorMessage(err, 'Could not skip setup'));
    }
  };

  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold tracking-tight">Welcome to Cashflow Copilot</h1>
      <p className="mx-auto mt-3 max-w-sm text-sm text-base-content/50">
        Take control of your money with a smarter way to track, understand and manage your
        finances. Setup takes about a minute.
      </p>

      <PrimaryButton onClick={onNext} size="lg" className="mt-8 w-full" disabled={complete.isPending}>
        Get Started
      </PrimaryButton>

      <button
        type="button"
        onClick={handleSkip}
        disabled={complete.isPending}
        className="mt-4 text-sm text-base-content/50 hover:text-white disabled:opacity-50"
      >
        {complete.isPending ? 'Skipping...' : 'Skip setup'}
      </button>
    </div>
  );
}