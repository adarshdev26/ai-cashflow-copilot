import { NextResponse } from 'next/server';
import { requireWorkspaceAccess } from '@/lib/auth/workspaces';
import { saveOnboardingSetup } from '@/lib/users/onboarding';
import { validateOnboardingSetup } from '@/lib/validations/onboarding';
import { prisma } from '@/lib/db/prisma';
import { logAudit, userActor } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';

export async function PATCH(req: Request) {
    try {
        // Workspace comes from the X-Workspace-Id header; the DB decides if this user is OWNER.
        const access = await requireWorkspaceAccess(req, 'OWNER');
        if (!access.ok) return access.response;

        let body: unknown;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        const parsed = validateOnboardingSetup(body);
        if (!parsed.ok) {
            return NextResponse.json({ error: parsed.error }, { status: 400 });
        }

        const [existingWorkspace, existingUser] = await Promise.all([
            prisma.workspace.findUnique({
                where: { id: access.workspaceId },
                select: { name: true, currency: true },
            }),
            prisma.user.findUnique({
                where: { id: access.userId },
                select: { primaryGoal: true },
            }),
        ]);
        const workspace = await saveOnboardingSetup({
            userId: access.userId,
            workspaceId: access.workspaceId,
            input: parsed.data,
        });

        const changes = {
            ...(existingWorkspace?.name !== workspace.name
                ? { name: { before: existingWorkspace?.name ?? null, after: workspace.name } }
                : {}),
            ...(existingWorkspace?.currency !== workspace.currency
                ? {
                      currency: {
                          before: existingWorkspace?.currency ?? null,
                          after: workspace.currency,
                      },
                  }
                : {}),
            ...(parsed.data.primaryGoal !== undefined &&
            existingUser?.primaryGoal !== parsed.data.primaryGoal
                ? {
                      primaryGoal: {
                          before: existingUser?.primaryGoal ?? null,
                          after: parsed.data.primaryGoal,
                      },
                  }
                : {}),
        };
        if (Object.keys(changes).length > 0) {
            await logAudit({
                actor: await userActor(access.userId),
                action: AUDIT_ACTIONS.ONBOARDING_SETUP_COMPLETED,
                resourceType: 'workspace',
                resourceId: workspace.workspaceId,
                workspaceId: workspace.workspaceId,
                metadata: { targetName: workspace.name, changes },
            });
        }

        return NextResponse.json({ workspace }, { status: 200 });
    } catch (error) {
        console.error('Onboarding setup error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
