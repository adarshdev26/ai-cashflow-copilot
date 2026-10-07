import type { SettingValue } from '@/lib/settings/registry';

export type SettingsValues = Record<string, SettingValue>;
export type SettingsPatch = Record<string, SettingValue | null>;

async function request(url: string, init?: RequestInit): Promise<SettingsValues> {
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
        const first = data?.errors ? Object.values(data.errors)[0] : null;
        throw new Error((first as string) || data?.error || 'Request failed');
    }
    return data.values as SettingsValues;
}
const patch = (url: string, values: SettingsPatch) =>
    request(url, { method: 'PATCH', body: JSON.stringify({ values }) });

export const getPublicSettings = () => request('/api/settings/public');
export const getAdminSettings = () => request('/api/admin/settings');
export const updateAdminSettings = (v: SettingsPatch) => patch('/api/admin/settings', v);
export const getUserPreferences = () => request('/api/settings/preferences');
export const updateUserPreferences = (v: SettingsPatch) => patch('/api/settings/preferences', v);
export const resetUserPreferences = () =>
    request('/api/settings/preferences', { method: 'DELETE' });
export const getWorkspaceSettings = (id: string) => request(`/api/workspaces/${id}/settings`);
export const updateWorkspaceSettings = (id: string, v: SettingsPatch) =>
    patch(`/api/workspaces/${id}/settings`, v);
