import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth/auth';
import {
    getUserPreferences,
    resetUserPreferences,
    updateUserPreferences,
} from '@/lib/settings/server';
import { logAudit, userActor } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';

// The user id ALWAYS comes from the session, never from the client.
export async function GET() {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    try {
        return NextResponse.json({ values: await getUserPreferences(userId) });
    } catch (error) {
        console.error('Failed to load preferences:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    try {
        const before = await getUserPreferences(userId);
        const body = await req.json().catch(() => null);
        const result = await updateUserPreferences(userId, body?.values);
        if (!result.ok)
            return NextResponse.json(
                { error: 'Invalid preferences', errors: result.errors },
                { status: 400 },
            );
        const changes = Object.fromEntries(
            Object.keys(result.values)
                .filter((key) => before[key] !== result.values[key])
                .map((key) => [key, { before: before[key], after: result.values[key] }]),
        );
        if (Object.keys(changes).length > 0) {
            await logAudit({
                actor: await userActor(userId),
                action: AUDIT_ACTIONS.USER_PREFERENCES_UPDATED,
                resourceType: 'user',
                resourceId: userId,
                metadata: { changes },
            });
        }
        return NextResponse.json({ values: result.values });
    } catch (error) {
        console.error('Failed to update preferences:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE() {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    try {
        const before = await getUserPreferences(userId);
        const values = await resetUserPreferences(userId);
        const changes = Object.fromEntries(
            Object.keys(values)
                .filter((key) => before[key] !== values[key])
                .map((key) => [key, { before: before[key], after: values[key] }]),
        );
        if (Object.keys(changes).length > 0) {
            await logAudit({
                actor: await userActor(userId),
                action: AUDIT_ACTIONS.USER_PREFERENCES_RESET,
                resourceType: 'user',
                resourceId: userId,
                metadata: { changes },
            });
        }
        return NextResponse.json({ values });
    } catch (error) {
        console.error('Failed to reset preferences:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
