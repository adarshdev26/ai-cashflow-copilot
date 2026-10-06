import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invalidateAdminData } from '../../shared/api/admin-api';
import { adminUsersApi } from '../api/users-api';

export function useAdminUsers(params: Record<string, unknown>) {
    return useQuery({
        queryKey: ['admin-users', 'list', params],
        queryFn: () => adminUsersApi.list(params),
        placeholderData: (prev) => prev,
    });
}

export function useAdminUser(id: string | null) {
    return useQuery({
        queryKey: ['admin-users', 'detail', id],
        queryFn: () => adminUsersApi.get(id!),
        enabled: !!id,
    });
}

export function useAdminUserMutations() {
    const qc = useQueryClient();
    const onSuccess = () => invalidateAdminData(qc);
    return {
        create: useMutation({ mutationFn: adminUsersApi.create, onSuccess }),
        update: useMutation({
            mutationFn: (v: { id: string; name?: string; email?: string; plan?: 'FREEMIUM' | 'PREMIUM' }) =>
                adminUsersApi.update(v.id, { name: v.name, email: v.email, plan: v.plan }),
            onSuccess,
        }),
        setStatus: useMutation({
            mutationFn: (v: { id: string; isActive: boolean }) =>
                adminUsersApi.setStatus(v.id, v.isActive),
            onSuccess,
        }),
        resetPassword: useMutation({
            mutationFn: (v: { id: string; password: string }) =>
                adminUsersApi.resetPassword(v.id, v.password),
            onSuccess,
        }),
        impersonate: useMutation({ mutationFn: (id: string) => adminUsersApi.impersonate(id) }),
        remove: useMutation({ mutationFn: (id: string) => adminUsersApi.remove(id), onSuccess }),
    };
}
