import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getWorkspaces,
  updateWorkspace,
  deleteWorkspace,
  getWorkspaceAccess,
  addWorkspaceMember,
  updateWorkspaceMember,
  removeWorkspaceMember,
} from '../api/workspaces-api';

export const workspaceKeys = { 
  all: ['workspaces'] as const,
  access: (workspaceId: string) => ['workspaces', workspaceId, 'access'] as const,
};

export function useWorkspaces() {
  return useQuery({
    queryKey: workspaceKeys.all,
    queryFn: getWorkspaces,
    select: (data) => data.workspaces,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, name }: { workspaceId: string; name: string }) =>
      updateWorkspace(workspaceId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workspaceId: string) => deleteWorkspace(workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
    },
  });
}

export function useWorkspaceAccess(workspaceId: string) {
  return useQuery({
    queryKey: workspaceKeys.access(workspaceId),
    queryFn: () => getWorkspaceAccess(workspaceId),
  });
}

export function useAddWorkspaceMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, email, role }: { workspaceId: string; email: string; role: string }) =>
      addWorkspaceMember(workspaceId, email, role),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.access(variables.workspaceId) });
    },
  });
}

export function useUpdateWorkspaceMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, userId, role }: { workspaceId: string; userId: string; role: string }) =>
      updateWorkspaceMember(workspaceId, userId, role),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.access(variables.workspaceId) });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
    },
  });
}

export function useRemoveWorkspaceMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, userId }: { workspaceId: string; userId: string }) =>
      removeWorkspaceMember(workspaceId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.access(variables.workspaceId) });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
    },
  });
}