import { apiFetch, withWorkspace } from '@/lib/api-client';
import type { PlanConfig, PlanId, PlanLimitKey, PlanFeatureKey } from '@/lib/plans/constants';

export type PlanResponse = {
    plan: PlanId; // the signed-in user's own plan
    workspacePlan: PlanId; // the active workspace owner's plan
    limits: Record<PlanLimitKey, number>;
    features: Record<PlanFeatureKey, boolean>;
    usage: Record<PlanLimitKey, number>;
    catalog: Record<PlanId, PlanConfig>;
};

export const plansApi = {
    get: (workspaceId: string) => apiFetch<PlanResponse>('/api/plan', withWorkspace(workspaceId)),
    changePlan: (plan: PlanId) =>
        apiFetch<{ plan: PlanId }>('/api/billing/upgrade', {
            method: 'POST',
            body: JSON.stringify({ plan }),
        }),
};