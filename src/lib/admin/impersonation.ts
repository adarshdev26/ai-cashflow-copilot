import { cookies } from 'next/headers';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { getJwtSecret, TOKEN_BACKUP_COOKIE } from '@/lib/auth/auth';
import { getSystemNumber } from '@/lib/settings/server';

export async function setImpersonationCookie(user: { id: string; email: string }, adminId: string) {
  const [impersonationMinutes, userSessionDays] = await Promise.all([
    getSystemNumber('auth.impersonationMinutes'),
    getSystemNumber('auth.userSessionDays'),
  ]);
  const impersonationSeconds = impersonationMinutes * 60;
  const cookieStore = await cookies();
  const currentToken = cookieStore.get('token')?.value;

  if (currentToken && !currentToken.includes('impersonatedBy')) {
    cookieStore.set(TOKEN_BACKUP_COOKIE, currentToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
       maxAge: userSessionDays * 86400,
      path: '/',
    });
  }

  const signOptions: SignOptions = {
    expiresIn: `${impersonationSeconds}s` as SignOptions['expiresIn'],
  };

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      impersonatedBy: adminId,
      impersonatedAt: Date.now(),
    },
    getJwtSecret(),
    signOptions
  );

  cookieStore.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: impersonationSeconds,
    path: '/',
  });
}

export async function clearImpersonationSession() {
  const cookieStore = await cookies();
  const backup = cookieStore.get(TOKEN_BACKUP_COOKIE)?.value;

  cookieStore.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });

  cookieStore.set(TOKEN_BACKUP_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });

  if (backup) {
    const sessionSeconds = (await getSystemNumber('auth.userSessionDays')) * 86400;
    const decoded = jwt.decode(backup);
    const tokenExpiry = typeof decoded === 'object' && decoded !== null && typeof decoded.exp === 'number'
      ? decoded.exp
      : undefined;
    const remainingSeconds = tokenExpiry === undefined
      ? sessionSeconds
      : Math.max(0, Math.min(sessionSeconds, tokenExpiry - Math.floor(Date.now() / 1000)));
    if (remainingSeconds > 0) {
      cookieStore.set('token', backup, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: remainingSeconds,
        path: '/',
      });
    }
  }
}
