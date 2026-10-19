'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useActiveWorkspaceId } from '@/features/workspaces/WorkspaceProvider';
import { notesApi } from '../api/notes-api';
import type { CreateNoteInput, NoteFilters, UpdateNoteInput } from '../types';

export const noteKeys = {
    all: (workspaceId: string) => ['notes', workspaceId] as const,
    list: (workspaceId: string, filters?: NoteFilters) =>
        ['notes', workspaceId, 'list', filters ?? {}] as const,
    detail: (workspaceId: string, id: string) => ['notes', workspaceId, 'detail', id] as const,
};

export function useNotes(filters?: NoteFilters, workspaceIdOverride?: string) {
    const activeWorkspaceId = useActiveWorkspaceId();
    const workspaceId = workspaceIdOverride ?? activeWorkspaceId;

    return useQuery({
        queryKey: noteKeys.list(workspaceId, filters),
        queryFn: () => notesApi.list(workspaceId, filters),
        placeholderData: keepPreviousData,
        enabled: Boolean(workspaceId),
    });
}

export function useNote(id: string, workspaceIdOverride?: string) {
    const activeWorkspaceId = useActiveWorkspaceId();
    const workspaceId = workspaceIdOverride ?? activeWorkspaceId;

    return useQuery({
        queryKey: noteKeys.detail(workspaceId, id),
        queryFn: () => notesApi.get(workspaceId, id),
        enabled: Boolean(workspaceId && id),
    });
}

function useInvalidateNotes() {
    const queryClient = useQueryClient();
    const workspaceId = useActiveWorkspaceId();

    return () => {
        queryClient.invalidateQueries({ queryKey: noteKeys.all(workspaceId) });
        queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    };
}

export function useCreateNote() {
    const workspaceId = useActiveWorkspaceId();
    const invalidate = useInvalidateNotes();

    return useMutation({
        mutationFn: (input: CreateNoteInput) => notesApi.create(workspaceId, input),
        onSuccess: invalidate,
    });
}

export function useUpdateNote() {
    const workspaceId = useActiveWorkspaceId();
    const invalidate = useInvalidateNotes();

    return useMutation({
        mutationFn: (input: UpdateNoteInput) => notesApi.update(workspaceId, input),
        onSuccess: invalidate,
    });
}

export function useToggleNote() {
    const workspaceId = useActiveWorkspaceId();
    const invalidate = useInvalidateNotes();

    return useMutation({
        mutationFn: (id: string) => notesApi.toggle(workspaceId, id),
        onSuccess: invalidate,
    });
}

export function usePinNote() {
    const workspaceId = useActiveWorkspaceId();
    const invalidate = useInvalidateNotes();

    return useMutation({
        mutationFn: (id: string) => notesApi.pin(workspaceId, id),
        onSuccess: invalidate,
    });
}

export function useRestoreNote() {
    const workspaceId = useActiveWorkspaceId();
    const invalidate = useInvalidateNotes();

    return useMutation({
        mutationFn: (id: string) => notesApi.restore(workspaceId, id),
        onSuccess: invalidate,
    });
}

export function useDeleteNote() {
    const workspaceId = useActiveWorkspaceId();
    const invalidate = useInvalidateNotes();

    return useMutation({
        mutationFn: (id: string) => notesApi.delete(workspaceId, id),
        onSuccess: invalidate,
    });
}
