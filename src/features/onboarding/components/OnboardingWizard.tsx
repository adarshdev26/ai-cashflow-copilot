'use client';

import { useState } from 'react';
import { useWorkspaces } from '@/features/workspaces/hooks/use-workspaces';
import { getOnboardingWorkspace } from '../lib/get-onboarding-workspace';
import { WIZARD_STEPS } from '../types';
import { StepComplete } from './StepComplete';
import { StepInviteMembers } from './StepInviteMembers';
import { StepWelcome } from './StepWelcome';
import { StepWorkspaceSetup } from './StepWorkspaceSetup';
import { WizardProgress } from './WizardProgress';

export function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const { data: workspaces, isLoading } = useWorkspaces();

  // Always the workspace the user OWNS (Personal), never the invited one.
  const workspace = getOnboardingWorkspace(workspaces);

  const next = () => setStep((s) => Math.min(WIZARD_STEPS.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const renderStep = () => {
    if (step === 0) return <StepWelcome onNext={next} />;
    if (step === 3) return <StepComplete />;

    // Steps 2 and 3 both need the owned workspace.
    if (isLoading) return <p className="text-sm text-gray-400">Loading your workspace...</p>;
    if (!workspace) {
      return (
        <div className="space-y-4">
          <p className="text-sm text-red-400">We could not find your workspace.</p>
          <button type="button" onClick={back} className="text-sm text-gray-400 hover:text-white">
            Back
          </button>
        </div>
      );
    }

    if (step === 1) return <StepWorkspaceSetup workspace={workspace} onBack={back} onNext={next} />;
    return <StepInviteMembers workspaceId={workspace.workspaceId} onBack={back} onNext={next} />;
  };

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 shadow-2xl">
      <WizardProgress steps={WIZARD_STEPS} current={step} />
      <div className="mt-8">{renderStep()}</div>
    </div>
  );
}