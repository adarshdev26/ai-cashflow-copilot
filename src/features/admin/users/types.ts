import type { WorkspaceRole } from '../shared/types';

export type AdminUserWorkspace = { workspaceId: string; name: string; role: WorkspaceRole; isOwner: boolean; isActive: boolean };
export type AdminUserRow = { id: string; name: string | null; email: string; isActive: boolean; createdAt: string; workspaces: AdminUserWorkspace[] };
export type AdminUserSortField = 'createdAt' | 'name' | 'email';
export type AdminUserFilters = { search?: string; isActive?: 'true' | 'false' };
