import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyPassword } from '@/lib/users/users';
import { setAdminCookie } from '@/lib/admin/auth';
import { getSystemNumber } from '@/lib/settings/server';
import { logAudit } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => null);
        const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
        const password = typeof body?.password === 'string' ? body.password : '';
        if (!email || !password) {
            await logAudit({
                actor: { type: 'ADMIN', id: null, name: null, email: email || null },
                action: AUDIT_ACTIONS.ADMIN_LOGIN_FAILED,
                resourceType: 'admin',
                metadata: { reason: 'invalid_credentials' },
                request: req,
            });
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const admin = await prisma.admin.findUnique({ where: { email } });
        const [valid, sessionHours] = admin
            ? await Promise.all([
                  verifyPassword(password, admin.password),
                  getSystemNumber('auth.adminSessionHours'),
              ])
            : [false, undefined];
        if (!admin || !valid || !admin.isActive) {
            await logAudit({
                actor: {
                    type: 'ADMIN',
                    id: admin?.id ?? null,
                    name: admin?.name ?? null,
                    email: admin?.email ?? email,
                },
                action: AUDIT_ACTIONS.ADMIN_LOGIN_FAILED,
                resourceType: 'admin',
                resourceId: admin?.id,
                metadata: { reason: admin && !admin.isActive ? 'inactive_account' : 'invalid_credentials' },
                request: req,
            });
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        await setAdminCookie(admin, sessionHours);
        await logAudit({
            actor: { type: 'ADMIN', id: admin.id, name: admin.name, email: admin.email },
            action: AUDIT_ACTIONS.ADMIN_LOGIN_SUCCEEDED,
            resourceType: 'admin',
            resourceId: admin.id,
            request: req,
        });
        return NextResponse.json({ admin: { id: admin.id, name: admin.name, email: admin.email } });
    } catch (error) {
        console.error('Admin login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
