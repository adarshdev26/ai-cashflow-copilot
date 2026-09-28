import { apiFetch, withWorkspace } from '@/lib/api-client';
import type { WorkspacesResponse, WorkspaceSummary, WorkspaceAccess } from '../types';

export function getWorkspaces() {
  return apiFetch<WorkspacesResponse>('/api/workspaces');
}

export function createWorkspace(name: string) {
  return apiFetch<{ workspace: WorkspaceSummary }>('/api/workspaces', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export function updateWorkspace(workspaceId: string, name: string) {
  return apiFetch<WorkspaceSummary>(`/api/workspaces/${workspaceId}`, {
    ...withWorkspace(workspaceId),
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
}

export function deleteWorkspace(workspaceId: string) {
  return apiFetch<void>(`/api/workspaces/${workspaceId}`, {
    ...withWorkspace(workspaceId),
    method: 'DELETE',
  });
}

export function getWorkspaceAccess(workspaceId: string) {
  return apiFetch<WorkspaceAccess[]>(`/api/workspaces/${workspaceId}/access`, withWorkspace(workspaceId));
}

export function addWorkspaceMember(workspaceId: string, email: string, role: string) {
  return apiFetch<WorkspaceAccess>(`/api/workspaces/${workspaceId}/access`, {
    ...withWorkspace(workspaceId),
    method: 'POST',
    body: JSON.stringify({ email, role }),
  });
}

export function updateWorkspaceMember(workspaceId: string, userId: string, role: string) {
  return apiFetch<WorkspaceAccess>(`/api/workspaces/${workspaceId}/access/${userId}`, {
    ...withWorkspace(workspaceId),
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export function removeWorkspaceMember(workspaceId: string, userId: string) {
  return apiFetch<void>(`/api/workspaces/${workspaceId}/access/${userId}`, {
    ...withWorkspace(workspaceId),
    method: 'DELETE',
  });
}