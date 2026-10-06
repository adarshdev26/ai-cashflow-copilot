import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useActiveWorkspaceId } from '@/features/workspaces';
import {
    isUnlimited, type PlanFeatureKey, type PlanId, type PlanLimitKey,
} from '@/lib/plans/constants';
import { plansApi } from '../api/plans-api';

export function usePlan() {
    const workspaceId = useActiveWorkspaceId();
    return useQuery({
        queryKey: ['plan', workspaceId],
        queryFn: () => plansApi.get(workspaceId as string),
        enabled: !!workspaceId,
        staleTime: 60_000,
    });
}

/** While loading, canCreate is true so the click goes through and the server decides. */
export function useLimit(key: PlanLimitKey) {
    const { data, isLoading } = usePlan();
    const limit = data?.limits[key] ?? 0;
    const used = data?.usage[key] ?? 0;
    const unlimited = isUnlimited(limit);
    return {
        limit,
        used,
        unlimited,
        isLoading,
        canCreate: isLoading || !data || unlimited || used < limit,
    };
}

export function useFeature(key: PlanFeatureKey) {
    const { data, isLoading } = usePlan();
    return { enabled: isLoading || !data || data.features[key], isLoading };
}

export function useChangePlan() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (plan: PlanId) => plansApi.changePlan(plan),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['plan'] }),
    });
}