'use client';

import { useState } from 'react';
import { PrimaryButton } from '@/components/ui/Button';
import { WIZARD_STEPS } from '../types';
import { WizardProgress } from './WizardProgress';

// TEMPORARY stub: commit 6 replaces the placeholder with the real steps.
export function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const last = WIZARD_STEPS.length - 1;

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 shadow-2xl">
      <WizardProgress steps={WIZARD_STEPS} current={step} />

      <div className="mt-8 min-h-[200px]">
        <p className="text-sm text-gray-400">
          Step {step + 1}: {WIZARD_STEPS[step]} (placeholder)
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="text-sm text-gray-400 hover:text-white disabled:invisible"
        >
          Back
        </button>
        <PrimaryButton onClick={() => setStep((s) => Math.min(last, s + 1))} disabled={step === last}>
          Next
        </PrimaryButton>
      </div>
    </div>
  );
}