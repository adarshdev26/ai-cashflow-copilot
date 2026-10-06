import 'server-only';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSystemBool, getSystemNumber } from '@/lib/settings/server';
import {
    PLAN_FEATURES,
    PLAN_IDS,
    PLAN_LIMITS,
    isUnlimited,
    planSettingKey,
    type PlanConfig,
    type PlanFeatureKey,
    type PlanId,
    type PlanLimitKey,
} from './constants';

/** Anything that is not exactly PREMIUM is treated as FREEMIUM. */
export const normalizePlan = (value: unknown): PlanId =>
    value === 'PREMIUM' ? 'PREMIUM' : 'FREEMIUM';

export async function getUserPlan(userId: string): Promise<PlanId> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
    return normalizePlan(user?.plan);
}

/** Workspace-scoped limits follow the OWNER's plan, never the acting member's. */
export async function getWorkspaceOwnerPlan(workspaceId: string): Promise<PlanId> {
    const ws = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { owner: { select: { plan: true } } },
    });
    return normalizePlan(ws?.owner.plan);
}

export async function getPlanConfig(plan: PlanId): Promise<PlanConfig> {
    const limitKeys = Object.keys(PLAN_LIMITS) as PlanLimitKey[];
    const featureKeys = Object.keys(PLAN_FEATURES) as PlanFeatureKey[];
    const [limits, features] = await Promise.all([
        Promise.all(
            limitKeys.map(
                async (k) => [k, await getSystemNumber(planSettingKey(plan, k))] as const,
            ),
        ),
        Promise.all(
            featureKeys.map(
                async (k) => [k, await getSystemBool(planSettingKey(plan, k))] as const,
            ),
        ),
    ]);
    return {
        limits: Object.fromEntries(limits) as PlanConfig['limits'],
        features: Object.fromEntries(features) as PlanConfig['features'],
    };
}

export async function getPlanCatalog(): Promise<Record<PlanId, PlanConfig>> {
    const entries = await Promise.all(
        PLAN_IDS.map(async (p) => [p, await getPlanConfig(p)] as const),
    );
    return Object.fromEntries(entries) as Record<PlanId, PlanConfig>;
}

export type UsageContext = { userId?: string; workspaceId?: string };

/**
 * Current usage per limit. The switch is exhaustive: a new key in PLAN_LIMITS
 * will not compile until you add its case here.
 */
export async function getUsage(key: PlanLimitKey, ctx: UsageContext): Promise<number> {
    const { userId, workspaceId } = ctx;
    switch (key) {
        case 'maxWorkspaces':
            return userId ? prisma.workspace.count({ where: { ownerId: userId } }) : 0;
        case 'maxCollaborators': {
            if (!workspaceId) return 0;
            const [members, pending] = await Promise.all([
                prisma.workspaceAccess.count({ where: { workspaceId, role: { not: 'OWNER' } } }),
                prisma.workspaceInvitation.count({
                    where: { workspaceId, status: 'PENDING', expiresAt: { gt: new Date() } },
                }),
            ]);
            return members + pending;
        }
        case 'maxAccounts':
            return workspaceId
                ? prisma.financialAccount.count({ where: { workspaceId, isActive: true } })
                : 0;
        case 'maxCustomCategories':
            return workspaceId
                ? prisma.category.count({ where: { workspaceId, isActive: true } })
                : 0;
        case 'maxBudgets':
            return workspaceId
                ? prisma.budget.count({ where: { workspaceId, isActive: true } })
                : 0;
        case 'maxRecurring':
            return workspaceId
                ? prisma.recurringTransaction.count({ where: { workspaceId, isActive: true } })
                : 0;
        case 'maxTemplates':
            return workspaceId ? prisma.transactionTemplate.count({ where: { workspaceId } }) : 0;
    }
}

// ---------- enforcement (each returns a NextResponse to return, or null to continue) ----------

export async function enforceLimit(opts: {
    key: PlanLimitKey;
    plan: PlanId;
    ctx: UsageContext;
    add?: number;
}): Promise<NextResponse | null> {
    const { key, plan, ctx, add = 1 } = opts;
    const limit = (await getPlanConfig(plan)).limits[key];
    if (isUnlimited(limit)) return null;

    const current = await getUsage(key, ctx);
    if (current + add <= limit) return null;

    return NextResponse.json(
        {
            error: `${PLAN_LIMITS[key]} limit reached (${current}/${limit}). Upgrade to add more.`,
            code: 'PLAN_LIMIT',
            key,
            limit,
            current,
            plan,
        },
        { status: 403 },
    );
}

export async function enforceFeature(opts: {
    key: PlanFeatureKey;
    plan: PlanId;
}): Promise<NextResponse | null> {
    const enabled = (await getPlanConfig(opts.plan)).features[opts.key];
    if (enabled) return null;
    return NextResponse.json(
        {
            error: `${PLAN_FEATURES[opts.key]} is not included in your plan. Upgrade to unlock it.`,
            code: 'PLAN_FEATURE',
            key: opts.key,
            plan: opts.plan,
        },
        { status: 403 },
    );
}

// ---------- one-liners used by routes ----------

/** For user-owned limits (maxWorkspaces). Uses the acting user's plan. */
export async function enforceUserLimit(userId: string, key: PlanLimitKey) {
    return enforceLimit({ key, plan: await getUserPlan(userId), ctx: { userId } });
}

/** For workspace-scoped limits. Uses the workspace OWNER's plan. */
export async function enforceWorkspaceLimit(workspaceId: string, key: PlanLimitKey, add = 1) {
    return enforceLimit({
        key,
        plan: await getWorkspaceOwnerPlan(workspaceId),
        ctx: { workspaceId },
        add,
    });
}

export async function enforceWorkspaceFeature(workspaceId: string, key: PlanFeatureKey) {
    return enforceFeature({ key, plan: await getWorkspaceOwnerPlan(workspaceId) });
}
