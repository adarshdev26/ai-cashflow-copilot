import { NextResponse } from 'next/server';
import { requireUserId, setAuthCookie } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { hashPassword, verifyPassword } from '@/lib/users/users';
import { validatePassword } from '@/lib/validations/auth';
import { getSystemNumber } from '@/lib/settings/server';

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => null);
    const currentPassword = body?.currentPassword;
    const newPassword = body?.newPassword;

    if (typeof currentPassword !== 'string' || currentPassword.length === 0) {
      return NextResponse.json({ error: 'Current password is required' }, { status: 400 });
    }
    const pwError = validatePassword(newPassword, await getSystemNumber('auth.passwordMinLength'));
    if (pwError) return NextResponse.json({ error: pwError }, { status: 400 });
    if (currentPassword === newPassword) {
      return NextResponse.json({ error: 'New password must be different from the current one' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, password: true },
    });
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 400, not 401, so the client doesn't treat a typo as "session expired".
    if (!(await verifyPassword(currentPassword, user.password))) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    const password = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { password, passwordChangedAt: new Date() } }),
      // Any reset link requested earlier shouldn't work after this.
      prisma.passwordResetToken.deleteMany({ where: { userId, usedAt: null } }),
    ]);

    // Other devices are now logged out; keep this one signed in.
    await setAuthCookie({ id: user.id, email: user.email });

    return NextResponse.json({ message: 'Password updated' }, { status: 200 });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
