import { NextResponse } from 'next/server';
import { validatePassword } from '@/lib/validations/auth';
import { resetPasswordWithToken } from '@/lib/auth/password-reset';
import { getSystemNumber } from '@/lib/settings/server';
import { prisma } from '@/lib/db/prisma';
import { hashToken } from '@/lib/users/invitations';
import { logAudit } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => null);
        const token = body?.token;
        const password = body?.password;

        if (typeof token !== 'string' || token.length < 20 || token.length > 200) {
            return NextResponse.json(
                { error: 'This reset link is invalid or has expired' },
                { status: 400 },
            );
        }

        const passwordError = validatePassword(
            password,
            await getSystemNumber('auth.passwordMinLength'),
        );
        if (passwordError) {
            return NextResponse.json({ error: passwordError }, { status: 400 });
        }

        const resetRecord = await prisma.passwordResetToken.findUnique({
            where: { tokenHash: hashToken(token) },
            select: { user: { select: { id: true, name: true, email: true } } },
        });
        const result = await resetPasswordWithToken(token, password);
        if (!result.ok) {
            return NextResponse.json(
                { error: 'This reset link is invalid or has expired' },
                { status: 400 },
            );
        }

        if (resetRecord?.user) {
            await logAudit({
                actor: {
                    type: 'USER',
                    id: resetRecord.user.id,
                    name: resetRecord.user.name,
                    email: resetRecord.user.email,
                },
                action: AUDIT_ACTIONS.PASSWORD_RESET_COMPLETED,
                resourceType: 'user',
                resourceId: resetRecord.user.id,
                request: req,
            });
        }

        return NextResponse.json(
            { message: 'Password updated. You can now log in.' },
            { status: 200 },
        );
    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
