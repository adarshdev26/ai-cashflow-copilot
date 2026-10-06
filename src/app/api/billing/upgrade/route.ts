import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSessionInfo } from '@/lib/auth/auth';
import { logAudit, userActor } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';
import type { PlanId } from '@/lib/plans/constants';
import { isBillingDemoEnabled, paymentProvider } from '@/lib/plans/payment-provider';
import { normalizePlan } from '@/lib/plans/server';

export async function POST(req: Request) {
    if (!isBillingDemoEnabled())
        return NextResponse.json({ error: 'Billing is not available.' }, { status: 403 });

    const session = await getSessionInfo();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.impersonating)
        return NextResponse.json(
            { error: 'Plan changes are disabled while impersonating.' },
            { status: 403 },
        );

    const body = await req.json().catch(() => null);
    if (body?.plan !== 'FREEMIUM' && body?.plan !== 'PREMIUM')
        return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    const target: PlanId = body.plan;

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { id: true, name: true, email: true, plan: true },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const before = normalizePlan(user.plan);
    if (before === target) return NextResponse.json({ plan: target });

    let reference: string | undefined;
    if (target === 'PREMIUM') {
        const { checkoutId } = await paymentProvider.createCheckout({
            userId: user.id,
            plan: target,
        });
        const result = await paymentProvider.confirmPayment({ checkoutId });
        if (!result.paid) return NextResponse.json({ error: 'Payment failed' }, { status: 402 });
        reference = result.reference;
    }
    // Downgrade only changes the plan. Existing data is never deleted or deactivated.

    await prisma.user.update({ where: { id: user.id }, data: { plan: target } });

    await logAudit({
        actor: await userActor(user.id),
        action:
            target === 'PREMIUM'
                ? AUDIT_ACTIONS.BILLING_UPGRADED
                : AUDIT_ACTIONS.BILLING_DOWNGRADED,
        resourceType: 'user',
        resourceId: user.id,
        metadata: { before: { plan: before }, after: { plan: target }, reference },
        request: req,
    });

    return NextResponse.json({ plan: target });
}
