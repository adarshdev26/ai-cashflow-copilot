import { NextResponse } from 'next/server';
import { validatePassword } from '@/lib/validations/auth';
import { resetPasswordWithToken } from '@/lib/auth/password-reset';
import { getSystemNumber } from '@/lib/settings/server';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const token = body?.token;
    const password = body?.password;

    if (typeof token !== 'string' || token.length < 20 || token.length > 200) {
      return NextResponse.json({ error: 'This reset link is invalid or has expired' }, { status: 400 });
    }

    const passwordError = validatePassword(password, await getSystemNumber('auth.passwordMinLength'));
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const result = await resetPasswordWithToken(token, password);
    if (!result.ok) {
      return NextResponse.json({ error: 'This reset link is invalid or has expired' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Password updated. You can now log in.' }, { status: 200 });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
