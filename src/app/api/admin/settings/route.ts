import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { getSystemSettings, updateSystemSettings } from '@/lib/settings/server';

export async function GET() {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;
    try {
        return NextResponse.json({ values: await getSystemSettings() });
    } catch (error) {
        console.error('Failed to load admin settings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;
    try {
        const body = await req.json().catch(() => null);
        const result = await updateSystemSettings(guard.adminId, body?.values);
        if (!result.ok)
            return NextResponse.json(
                { error: 'Invalid settings', errors: result.errors },
                { status: 400 },
            );
        return NextResponse.json({ values: result.values });
    } catch (error) {
        console.error('Failed to update admin settings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
