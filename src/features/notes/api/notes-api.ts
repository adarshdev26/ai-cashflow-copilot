import { apiFetch, withWorkspace } from '@/lib/api-client';
import type {
    CreateNoteInput,
    NoteFilters,
    NoteResponse,
    NotesListResponse,
    UpdateNoteInput,
} from '../types';

export const notesApi = {
    list: (workspaceId: string, filters?: NoteFilters) => {
        const params = new URLSearchParams();
        if (filters?.search) params.set('search', filters.search);
        if (filters?.status && filters.status !== 'ALL') params.set('status', filters.status);
        if (filters?.category && filters.category !== 'ALL')
            params.set('category', filters.category);
        if (filters?.sortBy) params.set('sortBy', filters.sortBy);
        if (filters?.sortDir) params.set('sortDir', filters.sortDir);

        const qs = params.toString();
        return apiFetch<NotesListResponse>(
            `/api/notes${qs ? `?${qs}` : ''}`,
            withWorkspace(workspaceId),
        );
    },

    get: (workspaceId: string, id: string) =>
        apiFetch<NoteResponse>(`/api/notes/${id}`, withWorkspace(workspaceId)),

    create: (workspaceId: string, input: CreateNoteInput) =>
        apiFetch<NoteResponse>(
            '/api/notes',
            withWorkspace(workspaceId, {
                method: 'POST',
                body: JSON.stringify(input),
            }),
        ),

    update: (workspaceId: string, input: UpdateNoteInput) => {
        const { id, ...data } = input;
        return apiFetch<NoteResponse>(
            `/api/notes/${id}`,
            withWorkspace(workspaceId, {
                method: 'PATCH',
                body: JSON.stringify(data),
            }),
        );
    },

    toggle: (workspaceId: string, id: string) =>
        apiFetch<NoteResponse>(
            `/api/notes/${id}/toggle`,
            withWorkspace(workspaceId, {
                method: 'POST',
            }),
        ),

    pin: (workspaceId: string, id: string) =>
        apiFetch<NoteResponse>(
            `/api/notes/${id}/pin`,
            withWorkspace(workspaceId, {
                method: 'POST',
            }),
        ),

    restore: (workspaceId: string, id: string) =>
        apiFetch<NoteResponse>(
            `/api/notes/${id}/restore`,
            withWorkspace(workspaceId, {
                method: 'POST',
            }),
        ),

    delete: (workspaceId: string, id: string) =>
        apiFetch<{ success: boolean; id: string; deletedAt?: string }>(
            `/api/notes/${id}`,
            withWorkspace(workspaceId, {
                method: 'DELETE',
            }),
        ),
};
