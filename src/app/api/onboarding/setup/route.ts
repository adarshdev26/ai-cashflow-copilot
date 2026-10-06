import { NextResponse } from 'next/server';
import { requireWorkspaceAccess } from '@/lib/auth/workspaces';
import { saveOnboardingSetup } from '@/lib/users/onboarding';
import { validateOnboardingSetup } from '@/lib/validations/onboarding';

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

        const workspace = await saveOnboardingSetup({
            userId: access.userId,
            workspaceId: access.workspaceId,
            input: parsed.data,
        });

        return NextResponse.json({ workspace }, { status: 200 });
    } catch (error) {
        console.error('Onboarding setup error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
