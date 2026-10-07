import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invalidateAdminData } from '../../shared/api/admin-api';
import type { WorkspaceRole } from '../../shared/types';
import { adminWorkspacesApi } from '../api/workspaces-api';

export function useAdminWorkspaces(params: Record<string, unknown>) {
    return useQuery({
        queryKey: ['admin-workspaces', 'list', params],
        queryFn: () => adminWorkspacesApi.list(params),
        placeholderData: (prev) => prev,
    });
}
export function useAdminWorkspace(id: string | null) {
    return useQuery({
        queryKey: ['admin-workspaces', 'detail', id],
        queryFn: () => adminWorkspacesApi.get(id!),
        enabled: !!id,
    });
}
export function useAdminWorkspaceMutations() {
    const qc = useQueryClient();
    const onSuccess = () => invalidateAdminData(qc);
    return {
        update: useMutation({
            mutationFn: (v: { id: string; name?: string; currency?: string }) =>
                adminWorkspacesApi.update(v.id, { name: v.name, currency: v.currency }),
            onSuccess,
        }),
        setStatus: useMutation({
            mutationFn: (v: { id: string; isActive: boolean }) =>
                adminWorkspacesApi.setStatus(v.id, v.isActive),
            onSuccess,
        }),
        remove: useMutation({
            mutationFn: (id: string) => adminWorkspacesApi.remove(id),
            onSuccess,
        }),
    };
}
export function useAdminMemberMutations() {
    const qc = useQueryClient();
    const onSuccess = () => invalidateAdminData(qc);
    return {
        add: useMutation({
            mutationFn: (v: { workspaceId: string; email: string; role: WorkspaceRole }) =>
                adminWorkspacesApi.addMember(v.workspaceId, { email: v.email, role: v.role }),
            onSuccess,
        }),
        setRole: useMutation({
            mutationFn: (v: { workspaceId: string; userId: string; role: WorkspaceRole }) =>
                adminWorkspacesApi.setMemberRole(v.workspaceId, v.userId, v.role),
            onSuccess,
        }),
        remove: useMutation({
            mutationFn: (v: { workspaceId: string; userId: string }) =>
                adminWorkspacesApi.removeMember(v.workspaceId, v.userId),
            onSuccess,
        }),
    };
}
