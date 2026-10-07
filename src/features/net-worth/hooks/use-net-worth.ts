import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getNetWorth, getNetWorthHistory } from '../api/net-worth-api';

export const netWorthKeys = {
    all: (workspaceId: string) => ['net-worth', workspaceId] as const,
    history: (workspaceId: string, range: string = '6m') =>
        ['net-worth', workspaceId, 'history', range] as const,
};

export function useNetWorth(workspaceId: string) {
    return useQuery({
        queryKey: netWorthKeys.all(workspaceId),
        queryFn: () => getNetWorth(workspaceId),
        placeholderData: keepPreviousData,
        staleTime: 30 * 1000,
    });
}

export function useNetWorthHistory(workspaceId: string, range: string = '6m') {
    return useQuery({
        queryKey: netWorthKeys.history(workspaceId, range),
        queryFn: () => getNetWorthHistory(workspaceId, range),
        placeholderData: keepPreviousData,
        staleTime: 30 * 1000,
    });
}
