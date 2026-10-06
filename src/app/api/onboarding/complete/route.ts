import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth/auth';
import { completeOnboarding } from '@/lib/users/onboarding';
import { prisma } from '@/lib/db/prisma';
import { logAudit } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';

export async function POST() {
    try {
        const userId = await requireUserId();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const existing = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, onboardingCompletedAt: true },
        });
        await completeOnboarding(userId);
        const updated = await prisma.user.findUnique({
            where: { id: userId },
            select: { onboardingCompletedAt: true },
        });
        if (existing && !existing.onboardingCompletedAt && updated?.onboardingCompletedAt) {
            await logAudit({
                actor: { type: 'USER', id: existing.id, name: existing.name, email: existing.email },
                action: AUDIT_ACTIONS.ONBOARDING_COMPLETED,
                resourceType: 'user',
                resourceId: existing.id,
                metadata: {
                    before: { onboardingCompletedAt: null },
                    after: { onboardingCompletedAt: updated.onboardingCompletedAt },
                },
            });
        }
        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (error) {
        console.error('Onboarding complete error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
