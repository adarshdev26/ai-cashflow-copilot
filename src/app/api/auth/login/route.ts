import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import { setAuthCookie } from '@/lib/auth/auth';
import { logAudit } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
            await logAudit({
                actor: {
                    type: 'USER',
                    id: null,
                    name: null,
                    email: typeof email === 'string' ? email.trim() : null,
                },
                action: AUDIT_ACTIONS.USER_LOGIN_FAILED,
                resourceType: 'user',
                metadata: { reason: 'invalid_credentials' },
                request: req,
            });
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const trimmed = email.trim();

        // Exact match first (existing users behave exactly as before), then a
        // case-insensitive fallback so "Bob@Example.com" finds "bob@example.com".
        const user =
            (await prisma.user.findUnique({ where: { email: trimmed } })) ??
            (await prisma.user.findFirst({
                where: { email: { equals: trimmed, mode: 'insensitive' } },
            }));

        if (!user) {
            await logAudit({
                actor: { type: 'USER', id: null, name: null, email: trimmed },
                action: AUDIT_ACTIONS.USER_LOGIN_FAILED,
                resourceType: 'user',
                metadata: { reason: 'invalid_credentials' },
                request: req,
            });
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            await logAudit({
                actor: { type: 'USER', id: user.id, name: user.name, email: user.email },
                action: AUDIT_ACTIONS.USER_LOGIN_FAILED,
                resourceType: 'user',
                resourceId: user.id,
                metadata: { reason: 'invalid_credentials' },
                request: req,
            });
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        if (!user.isActive) {
            await logAudit({
                actor: { type: 'USER', id: user.id, name: user.name, email: user.email },
                action: AUDIT_ACTIONS.USER_LOGIN_FAILED,
                resourceType: 'user',
                resourceId: user.id,
                metadata: { reason: 'inactive_account' },
                request: req,
            });
            return NextResponse.json(
                { error: 'Your account has been deactivated. Please contact support.' },
                { status: 403 },
            );
        }

        await setAuthCookie({ id: user.id, email: user.email });

        await logAudit({
            actor: { type: 'USER', id: user.id, name: user.name, email: user.email },
            action: AUDIT_ACTIONS.USER_LOGIN_SUCCEEDED,
            resourceType: 'user',
            resourceId: user.id,
            request: req,
        });

        return NextResponse.json({ message: 'Login successful', userId: user.id }, { status: 200 });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
