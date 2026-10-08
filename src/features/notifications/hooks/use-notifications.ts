'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useActiveWorkspaceId } from '@/features/workspaces/WorkspaceProvider';
import { notificationsApi } from '../api/notifications-api';
import type { NotificationListParams } from '../types';

/** Use this root key (workspace-agnostic) from OTHER features' mutations. */
export const NOTIFICATIONS_ROOT_KEY = ['notifications'] as const;

export const notificationKeys = {
    all: (ws: string) => ['notifications', ws] as const,
    list: (ws: string, params: NotificationListParams) =>
        ['notifications', ws, 'list', params] as const,
    count: (ws: string) => ['notifications', ws, 'count'] as const,
};

export function useNotifications(params: NotificationListParams) {
    const ws = useActiveWorkspaceId();
    return useQuery({
        queryKey: notificationKeys.list(ws, params),
        queryFn: () => notificationsApi.list(ws, params),
        placeholderData: keepPreviousData,
        staleTime: 60_000,
    });
}

export function useUnreadCount(enabled = true) {
    const ws = useActiveWorkspaceId();
    return useQuery({
        queryKey: notificationKeys.count(ws),
        queryFn: () => notificationsApi.count(ws),
        enabled,
        staleTime: 60_000,
        placeholderData: { unread: 0, total: 0 },
        select: (d) => d.unread,
    });
}

function useInvalidate() {
    const qc = useQueryClient();
    const ws = useActiveWorkspaceId();
    return () => qc.invalidateQueries({ queryKey: notificationKeys.all(ws) });
}

export function useMarkRead() {
    const ws = useActiveWorkspaceId();
    return useMutation({
        mutationFn: (id: string) => notificationsApi.markRead(ws, id),
        onSuccess: useInvalidate(),
    });
}

export function useMarkAllRead() {
    const ws = useActiveWorkspaceId();
    return useMutation({
        mutationFn: () => notificationsApi.markAllRead(ws),
        onSuccess: useInvalidate(),
    });
}

export function useDismiss() {
    const ws = useActiveWorkspaceId();
    return useMutation({
        mutationFn: (id: string) => notificationsApi.dismiss(ws, id),
        onSuccess: useInvalidate(),
    });
}
