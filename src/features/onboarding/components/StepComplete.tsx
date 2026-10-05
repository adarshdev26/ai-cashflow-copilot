'use client';

import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PrimaryButton } from '@/components/ui/Button';
import { notify, getErrorMessage } from '@/lib/ui/toast';
import { useCompleteOnboarding } from '../hooks/use-onboarding';
import { tourHref } from '../lib/tour-steps';
import { usePublicSettings } from '@/features/settings/hooks/use-settings';

export function StepComplete() {
  const router = useRouter();
  const complete = useCompleteOnboarding();
  const { data: settings } = usePublicSettings();
  const siteName = String(settings?.['branding.name'] ?? 'Cashflow Copilot');

  const handleFinish = async () => {
    if (complete.isPending || complete.isSuccess) return;
    try {
      await complete.mutateAsync(); // also invalidates ['current-user']
      router.replace(settings?.['features.tourEnabled'] === false ? '/dashboard' : tourHref('overview'));
      router.refresh(); // make the server layout re-read the DB
    } catch (err) {
      notify.error(getErrorMessage(err, 'Could not finish setup. Please try again.'));
    }
  };

  return (
    <div className="text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Check className="h-6 w-6" />
      </span>
      <h2 className="mt-4 text-2xl font-bold tracking-tight">You&apos;re all set!</h2>
      <p className="mx-auto mt-3 max-w-sm text-sm text-base-content/50">
        Your {siteName} workspace is ready. Start adding transactions and we&apos;ll help you
        understand your financial activity.
      </p>

      <PrimaryButton
        onClick={handleFinish}
        loading={complete.isPending || complete.isSuccess}
        size="lg"
        className="mt-8 w-full"
      >
        Go to Dashboard
      </PrimaryButton>
    </div>
  );
}
