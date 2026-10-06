import { NextResponse } from 'next/server';
import { isValidEmail } from '@/lib/validations/auth';
import { requestPasswordReset } from '@/lib/auth/password-reset';

const GENERIC = {
    message: 'If an account exists for that email, a reset link has been sent.',
};

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => null);
        const email = body?.email;

        if (!isValidEmail(email)) {
            return NextResponse.json(
                { error: 'Please enter a valid email address' },
                { status: 400 },
            );
        }

        await requestPasswordReset(email);
        return NextResponse.json(GENERIC, { status: 200 });
    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
