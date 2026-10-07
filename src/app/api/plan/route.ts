import { NextResponse } from 'next/server';
import { requireWorkspaceAccess } from '@/lib/auth/workspaces';
import { PLAN_LIMITS, type PlanLimitKey } from '@/lib/plans/constants';
import { getPlanCatalog, getUsage, getUserPlan, getWorkspaceOwnerPlan } from '@/lib/plans/server';

export async function GET(req: Request) {
    try {
        const access = await requireWorkspaceAccess(req, 'VIEWER');
        if (!access.ok) return access.response;
        const { userId, workspaceId } = access;

        const [plan, workspacePlan, catalog] = await Promise.all([
            getUserPlan(userId),
            getWorkspaceOwnerPlan(workspaceId),
            getPlanCatalog(),
        ]);

        // maxWorkspaces follows the USER's plan; everything else follows the workspace OWNER's plan.
        const limits = {
            ...catalog[workspacePlan].limits,
            maxWorkspaces: catalog[plan].limits.maxWorkspaces,
        };
        const keys = Object.keys(PLAN_LIMITS) as PlanLimitKey[];
        const usage = Object.fromEntries(
            await Promise.all(
                keys.map(async (k) => [k, await getUsage(k, { userId, workspaceId })] as const),
            ),
        );

        return NextResponse.json({
            plan,
            workspacePlan,
            limits,
            features: catalog[workspacePlan].features,
            usage,
            catalog,
        });
    } catch (error) {
        console.error('Failed to load plan:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
