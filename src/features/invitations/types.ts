import type { WorkspaceRole } from '@/features/workspaces/types';

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'CANCELLED';

/** OWNER can never be granted through an invitation. */
export type InvitableRole = Exclude<WorkspaceRole, 'OWNER'>;

export const INVITABLE_ROLES: readonly InvitableRole[] = ['ADMIN', 'MEMBER', 'VIEWER'];

/** Matches `invitationSelect` on the server (no tokenHash). Dates arrive as ISO strings. */
export type Invitation = {
  id: string;
  email: string;
  role: InvitableRole;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
  invitedBy: { id: string; email: string };
};

/** The raw token is only returned once, on create and resend. */
export type InvitationWithToken = {
  invitation: Invitation;
  token: string;
};

export type InvitationPreview = {
  workspaceName: string;
  role: InvitableRole;
  email: string;
  expiresAt: string;
  accountExists: boolean;
  viewer: { signedIn: boolean; emailMatches: boolean };
};

export type AcceptInvitationResponse = { workspaceId: string };

export type RegisterInvitationResponse = {
  message: string;
  userId: string;
  workspaceId: string;
};

export type RegisterInvitationInput = { name?: string; password: string };

/** Codes the invitation endpoints can return in ApiError.code. */
export type InvitationErrorCode =
  | 'INVALID'
  | 'EXPIRED'
  | 'ACCEPTED'
  | 'CANCELLED'
  | 'ALREADY_MEMBER'
  | 'INVITER_NOT_ALLOWED'
  | 'EMAIL_MISMATCH'
  | 'ACCOUNT_EXISTS';