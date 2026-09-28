import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getWorkspaces,
  createWorkspace,
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

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createWorkspace(name),
    // Returning the promise makes react-query wait for the refetch BEFORE
    // the component-level onSuccess runs, so the new workspace is already
    // in the list when we switch to it.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workspaceKeys.all }),
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
    onSuccess: (_, workspaceId) => {
      queryClient.removeQueries({ queryKey: workspaceKeys.access(workspaceId) });
      return queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
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