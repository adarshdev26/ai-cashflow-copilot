import { apiFetch, withWorkspace } from '@/lib/api-client';
import type { OnboardingSetupInput, OnboardingSetupResponse } from '../types';

/** workspaceId must be a workspace the user OWNS (the server checks). */
export function saveOnboardingSetup(workspaceId: string, input: OnboardingSetupInput) {
  return apiFetch<OnboardingSetupResponse>(
    '/api/onboarding/setup',
    withWorkspace(workspaceId, { method: 'PATCH', body: JSON.stringify(input) })
  );
}

export function completeOnboarding() {
  return apiFetch<{ ok: boolean }>('/api/onboarding/complete', { method: 'POST' });
}