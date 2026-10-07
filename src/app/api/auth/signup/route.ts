import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db/prisma';
import { createUserWithPersonalWorkspaceTx, hashPassword } from '@/lib/users/users';
import { getSystemBool } from '@/lib/settings/server';
import { getSystemNumber } from '@/lib/settings/server';
import { validatePassword } from '@/lib/validations/auth';
import { logAudit } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';

export async function POST(req: Request) {
    try {
        if (!(await getSystemBool('auth.signupEnabled'))) {
            return NextResponse.json({ error: 'Signups are currently disabled' }, { status: 403 });
        }
        const { email, password, name } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }
        const passwordError = validatePassword(
            password,
            await getSystemNumber('auth.passwordMinLength'),
        );
        if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 });

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: { email: { equals: email.trim(), mode: 'insensitive' } },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'User already exists with this email' },
                { status: 400 },
            );
        }

        // Hash password (bcrypt, 10 rounds, same as before)
        const hashedPassword = await hashPassword(password);

        // Create user, default workspace and OWNER access together (all or nothing)
        const user = await prisma.$transaction((tx) =>
            createUserWithPersonalWorkspaceTx(tx, { email, hashedPassword, name }),
        );

        await logAudit({
            actor: { type: 'USER', id: user.id, name: user.name, email: user.email },
            action: AUDIT_ACTIONS.USER_REGISTERED,
            resourceType: 'user',
            resourceId: user.id,
            metadata: { targetName: user.name, targetEmail: user.email },
            request: req,
        });

        return NextResponse.json(
            { message: 'User created successfully', userId: user.id },
            { status: 201 },
        );
    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
