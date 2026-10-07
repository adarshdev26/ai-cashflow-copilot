import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getNetWorth } from '../api/net-worth-api';

export const netWorthKeys = {
    all: (workspaceId: string) => ['net-worth', workspaceId] as const,
};

export function useNetWorth(workspaceId: string) {
    return useQuery({
        queryKey: netWorthKeys.all(workspaceId),
        queryFn: () => getNetWorth(workspaceId),
        placeholderData: keepPreviousData,
        staleTime: 30 * 1000,
    });
}
