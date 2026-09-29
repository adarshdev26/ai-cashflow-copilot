import type { WorkspaceRole } from './permissions';
export type { WorkspaceRole };

export type WorkspaceSummary = {
  workspaceId: string;
  role: WorkspaceRole;
  name: string;
  slug: string;
  ownerEmail: string | null;
};

export type WorkspaceAccess = {
  id?: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  createdAt?: string;
  user?: {
    id: string;
    email: string;
  };
};

export type WorkspacesResponse = { workspaces: WorkspaceSummary[] };