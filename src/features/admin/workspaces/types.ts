import type { WorkspaceRole } from '../shared/types';

type Person = { id: string; name: string | null; email: string };
export type AdminWorkspaceRow = {
    id: string;
    name: string;
    slug: string;
    currency: string;
    isActive: boolean;
    createdAt: string;
    owner: Person;
    memberCount: number;
    accountCount: number;
    categoryCount: number;
};
export type AdminWorkspaceMember = {
    userId: string;
    name: string | null;
    email: string;
    isActive: boolean;
    role: WorkspaceRole;
};
export type AdminWorkspaceDetail = Omit<AdminWorkspaceRow, 'memberCount'> & {
    members: AdminWorkspaceMember[];
};
export type AdminWorkspaceSortField =
    | 'name'
    | 'createdAt'
    | 'memberCount'
    | 'accountCount'
    | 'categoryCount';
export type AdminWorkspaceFilters = { search?: string; isActive?: 'true' | 'false' };
