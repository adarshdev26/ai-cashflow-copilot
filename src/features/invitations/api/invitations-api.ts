import { apiFetch, withWorkspace } from '@/lib/api-client';
import type {
  AcceptInvitationResponse,
  InvitableRole,
  Invitation,
  InvitationPreview,
  InvitationWithToken,
  RegisterInvitationInput,
  RegisterInvitationResponse,
} from '../types';

const base = (workspaceId: string) => `/api/workspaces/${workspaceId}/invitations`;

// ---------------------------------------------------------------------------
// Admin calls (workspace-scoped, require members.invite)
// ---------------------------------------------------------------------------

export function getInvitations(workspaceId: string) {
  return apiFetch<Invitation[]>(base(workspaceId), withWorkspace(workspaceId));
}

export function createInvitation(workspaceId: string, email: string, role: InvitableRole) {
  return apiFetch<InvitationWithToken>(
    base(workspaceId),
    withWorkspace(workspaceId, { method: 'POST', body: JSON.stringify({ email, role }) })
  );
}

export function cancelInvitation(workspaceId: string, invitationId: string) {
  return apiFetch<Record<string, never>>(
    `${base(workspaceId)}/${invitationId}`,
    withWorkspace(workspaceId, { method: 'DELETE' })
  );
}

export function resendInvitation(workspaceId: string, invitationId: string) {
  return apiFetch<InvitationWithToken>(
    `${base(workspaceId)}/${invitationId}/resend`,
    withWorkspace(workspaceId, { method: 'POST' })
  );
}

// ---------------------------------------------------------------------------
// Public calls (no workspace header: the invitee has no workspace context yet)
// ---------------------------------------------------------------------------

const publicBase = (token: string) => `/api/invitations/${encodeURIComponent(token)}`;

export function getInvitationPreview(token: string) {
  return apiFetch<InvitationPreview>(publicBase(token), { cache: 'no-store' });
}

export function acceptInvitation(token: string) {
  return apiFetch<AcceptInvitationResponse>(`${publicBase(token)}/accept`, { method: 'POST' });
}

export function registerViaInvitation(token: string, input: RegisterInvitationInput) {
  return apiFetch<RegisterInvitationResponse>(`${publicBase(token)}/register`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}