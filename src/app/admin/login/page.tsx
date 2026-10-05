'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AuthShell } from '@/components/auth/AuthShell';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { PrimaryButton } from '@/components/ui/Button';
import { authInputCls } from '@/components/ui/inputs';
import { apiFetch } from '@/lib/api-client';
import { notify, getErrorMessage } from '@/lib/ui/toast';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await apiFetch('/api/admin/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      router.replace('/admin/users'); router.refresh();
    } catch (err) {
      const message = getErrorMessage(err, 'Login failed'); setError(message); notify.error(message); setLoading(false);
    }
  }, [email, password, router]);

  return <AuthShell>
    <div className="w-full max-w-md rounded-xl border border-base-300 bg-base-100 p-8 shadow-2xl">
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-base-content">Admin sign in</h1>
      <p className="mb-6 text-sm text-base-content/60">Sign in to manage users and workspaces.</p>
      {error && <div role="alert" className="mb-4 rounded border border-error/20 bg-error/10 p-3 text-sm text-error">{error}</div>}
      <form onSubmit={submit} className="space-y-4">
        <div><label htmlFor="admin-login-email" className="mb-1 block text-sm font-medium text-base-content/70">Email</label><input id="admin-login-email" type="email" autoFocus autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required className={authInputCls} /></div>
        <div><label htmlFor="admin-login-password" className="mb-1 block text-sm font-medium text-base-content/70">Password</label><PasswordInput id="admin-login-password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required className={authInputCls} /></div>
        <PrimaryButton type="submit" loading={loading} className="w-full">Sign in</PrimaryButton>
      </form>
    </div>
  </AuthShell>;
}
