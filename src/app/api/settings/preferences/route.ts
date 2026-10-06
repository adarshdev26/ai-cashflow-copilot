import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth/auth';
import {
    getUserPreferences,
    resetUserPreferences,
    updateUserPreferences,
} from '@/lib/settings/server';

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
        const body = await req.json().catch(() => null);
        const result = await updateUserPreferences(userId, body?.values);
        if (!result.ok)
            return NextResponse.json(
                { error: 'Invalid preferences', errors: result.errors },
                { status: 400 },
            );
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
        return NextResponse.json({ values: await resetUserPreferences(userId) });
    } catch (error) {
        console.error('Failed to reset preferences:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
