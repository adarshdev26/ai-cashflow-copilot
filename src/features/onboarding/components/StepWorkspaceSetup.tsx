'use client';

import { useState } from 'react';
import { PrimaryButton } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { notify, getErrorMessage } from '@/lib/toast';
import { WORKSPACE_NAME_MAX, WORKSPACE_NAME_MIN } from '@/lib/validations/onboarding';
import { useSaveOnboardingSetup } from '../hooks/use-onboarding';
import { GOAL_OPTIONS, type OnboardingGoal } from '../types';

type Props = {
  workspace: { workspaceId: string; name: string };
  onBack: () => void;
  onNext: () => void;
};

const fieldClass =
  'w-full rounded-lg bg-gray-950 border border-gray-800 px-4 py-2.5 text-white focus:border-indigo-500 focus:outline-none';

export function StepWorkspaceSetup({ workspace, onBack, onNext }: Props) {
  const save = useSaveOnboardingSetup();
  const [name, setName] = useState(workspace.name);
  const [goal, setGoal] = useState<OnboardingGoal | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (save.isPending) return; // no double submits

    const trimmed = name.trim();
    if (trimmed.length < WORKSPACE_NAME_MIN || trimmed.length > WORKSPACE_NAME_MAX) {
      setError(`Workspace name must be ${WORKSPACE_NAME_MIN}-${WORKSPACE_NAME_MAX} characters`);
      return;
    }
    setError('');

    try {
      await save.mutateAsync({
        workspaceId: workspace.workspaceId,
        input: { name: trimmed, currency: 'INR', primaryGoal: goal },
      });
      onNext();
    } catch (err) {
      const message = getErrorMessage(err, 'Unable to save your workspace. Please try again.');
      setError(message);
      notify.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Set up your workspace</h2>
        <p className="mt-1 text-sm text-gray-400">
          Your workspace is where your financial data lives.
        </p>
      </div>

      {error && (
        <div className="rounded border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="ws-name" className="mb-1 block text-sm font-medium text-gray-400">
          Workspace name
        </label>
        <input
          id="ws-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={WORKSPACE_NAME_MAX}
          placeholder="Personal, Family or My Business"
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="ws-currency" className="mb-1 block text-sm font-medium text-gray-400">
          Currency
        </label>
        <select id="ws-currency" value="INR" disabled className={cn(fieldClass, 'opacity-70')}>
          <option value="INR">₹ INR — Indian Rupee</option>
        </select>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-gray-400">
          What do you want to do first? <span className="text-gray-600">(optional)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {GOAL_OPTIONS.map((opt) => {
            const selected = goal === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={selected}
                onClick={() => setGoal(selected ? null : opt.value)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs transition-colors',
                  selected
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                    : 'border-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-200'
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={save.isPending}
          className="text-sm text-gray-400 hover:text-white disabled:opacity-50"
        >
          Back
        </button>
        <PrimaryButton type="submit" loading={save.isPending}>
          Continue
        </PrimaryButton>
      </div>
    </form>
  );
}