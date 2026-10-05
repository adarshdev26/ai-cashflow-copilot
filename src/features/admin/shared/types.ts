export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
export const WORKSPACE_ROLES: WorkspaceRole[] = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'];
export type Pagination = { page: number; limit: number; totalCount: number; totalPages: number; hasMore: boolean };
export type Paged<T> = { data: T[]; pagination: Pagination };
export type AdminProfile = { id: string; name: string | null; email: string };
