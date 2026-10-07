import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { defaultsFor, publicDefaults } from '@/lib/settings/registry';
import * as api from '../api/settings-api';

export const settingsKeys = {
    public: ['settings', 'public'] as const,
    admin: ['settings', 'admin'] as const,
    user: ['settings', 'user'] as const,
    workspace: (id: string) => ['settings', 'workspace', id] as const,
};

/** Always returns usable values: registry defaults until the server answers. */
export function usePublicSettings() {
    return useQuery({
        queryKey: settingsKeys.public,
        queryFn: api.getPublicSettings,
        staleTime: 5 * 60_000,
        placeholderData: publicDefaults(),
    });
}

export function useAdminSettings() {
    return useQuery({ queryKey: settingsKeys.admin, queryFn: api.getAdminSettings });
}
export function useUpdateAdminSettings() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: api.updateAdminSettings,
        onSuccess: (values) => {
            qc.setQueryData(settingsKeys.admin, values);
            qc.invalidateQueries({ queryKey: settingsKeys.public });
        },
    });
}

export function useUserPreferences() {
    return useQuery({
        queryKey: settingsKeys.user,
        queryFn: api.getUserPreferences,
        staleTime: 5 * 60_000,
        placeholderData: defaultsFor('user'),
    });
}
export function useUserLocale() {
    const { data } = useUserPreferences();
    return String(data?.locale ?? 'en-IN');
}
export function useUpdateUserPreferences() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: api.updateUserPreferences,
        onSuccess: (v) => qc.setQueryData(settingsKeys.user, v),
    });
}
export function useResetUserPreferences() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: api.resetUserPreferences,
        onSuccess: (v) => qc.setQueryData(settingsKeys.user, v),
    });
}

export function useWorkspaceSettings(workspaceId: string) {
    return useQuery({
        queryKey: settingsKeys.workspace(workspaceId),
        queryFn: () => api.getWorkspaceSettings(workspaceId),
        enabled: !!workspaceId,
        staleTime: 60_000,
        placeholderData: defaultsFor('workspace'),
    });
}
export function useUpdateWorkspaceSettings(workspaceId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (v: api.SettingsPatch) => api.updateWorkspaceSettings(workspaceId, v),
        onSuccess: (values) => qc.setQueryData(settingsKeys.workspace(workspaceId), values),
    });
}
