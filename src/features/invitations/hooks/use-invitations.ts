import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  acceptInvitation,
  cancelInvitation,
  createInvitation,
  getInvitationPreview,
  getInvitations,
  registerViaInvitation,
  resendInvitation,
} from '../api/invitations-api';
import type { InvitableRole, RegisterInvitationInput } from '../types';

export const invitationKeys = {
  list: (workspaceId: string) => ['workspace-invitations', workspaceId] as const,
  preview: (token: string) => ['invitation-preview', token] as const,
};

// Same key as workspaceKeys.all in the workspaces feature.
const WORKSPACES_KEY = ['workspaces'] as const;

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export function useInvitations(workspaceId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: invitationKeys.list(workspaceId),
    queryFn: () => getInvitations(workspaceId),
    enabled: (options?.enabled ?? true) && !!workspaceId,
  });
}

export function useCreateInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, email, role }: { workspaceId: string; email: string; role: InvitableRole }) =>
      createInvitation(workspaceId, email, role),
    onSuccess: (_, variables) =>
      queryClient.invalidateQueries({ queryKey: invitationKeys.list(variables.workspaceId) }),
  });
}

export function useCancelInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, invitationId }: { workspaceId: string; invitationId: string }) =>
      cancelInvitation(workspaceId, invitationId),
    onSuccess: (_, variables) =>
      queryClient.invalidateQueries({ queryKey: invitationKeys.list(variables.workspaceId) }),
  });
}

export function useResendInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, invitationId }: { workspaceId: string; invitationId: string }) =>
      resendInvitation(workspaceId, invitationId),
    onSuccess: (_, variables) =>
      queryClient.invalidateQueries({ queryKey: invitationKeys.list(variables.workspaceId) }),
  });
}

// ---------------------------------------------------------------------------
// Public (invitee)
// ---------------------------------------------------------------------------

export function useInvitationPreview(token: string) {
  return useQuery({
    queryKey: invitationKeys.preview(token),
    queryFn: () => getInvitationPreview(token),
    enabled: !!token,
    retry: false, // 404/410 are final answers, not transient failures
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => acceptInvitation(token),
    // Returned so the workspace list is fresh before the component's onSuccess redirects.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: WORKSPACES_KEY }),
  });
}

export function useRegisterViaInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ token, ...input }: { token: string } & RegisterInvitationInput) =>
      registerViaInvitation(token, input),
    // Registering also logs the user in, so refresh user and workspaces.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: WORKSPACES_KEY }),
        queryClient.invalidateQueries({ queryKey: ['current-user'] }),
      ]),
  });
}