export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export type WorkspaceSummary = {
  workspaceId: string;
  role: WorkspaceRole;
  name: string;
  slug: string;
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