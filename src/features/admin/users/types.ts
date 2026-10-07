import type { WorkspaceRole } from '../shared/types';
import type { PlanId } from '@/lib/plans/constants';

export type AdminUserWorkspace = {
    workspaceId: string;
    name: string;
    role: WorkspaceRole;
    isOwner: boolean;
    isActive: boolean;
};
export type AdminUserRow = {
    id: string;
    name: string | null;
    email: string;
    isActive: boolean;
    plan: PlanId;
    createdAt: string;
    workspaces: AdminUserWorkspace[];
};
export type AdminUserSortField = 'createdAt' | 'name' | 'email' | 'isActive' | 'plan';
export type AdminUserFilters = { search?: string; isActive?: 'true' | 'false' };
