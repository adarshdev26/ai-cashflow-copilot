import { useMutation, useQueryClient } from '@tanstack/react-query';
import { workspaceKeys } from '@/features/workspaces/hooks/use-workspaces';
import { completeOnboarding, saveOnboardingSetup } from '../api/onboarding-api';
import type { OnboardingSetupInput } from '../types';

export function useSaveOnboardingSetup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, input }: { workspaceId: string; input: OnboardingSetupInput }) =>
      saveOnboardingSetup(workspaceId, input),
    // The workspace name may have changed, so refresh the list before the step advances.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workspaceKeys.all }),
  });
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: completeOnboarding,
    // Same key as useCurrentUser, so the flag isn't stale after we leave onboarding.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['current-user'] }),
  });
}