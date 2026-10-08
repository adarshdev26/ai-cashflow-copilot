import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { captureRouteError } from '@/lib/admin/errors';
import { runHealthChecks } from '@/features/admin/system-health/lib/checks';
import { HEALTH_GUIDE } from '@/features/admin/system-health/lib/guide';

export async function GET(req: Request) {
    const g = await requireAdmin();
    if (!g.ok) return g.response;

    try {
        const services = await runHealthChecks();
        return NextResponse.json({
            services, // each service now carries `info` (what / how / rules / nextStep)
            guide: HEALTH_GUIDE, // page-level explanation (statuses, error codes, limits)
            checkedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('System health check failed:', error);
        await captureRouteError(req, error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}