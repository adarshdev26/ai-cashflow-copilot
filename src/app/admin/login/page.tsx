'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { notify, getErrorMessage } from '@/lib/toast';
import { adminFetch } from '@/features/admin/lib/admin-fetch';
import { inputCls } from '@/features/admin/lib/styles';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminFetch('/api/admin/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      router.replace('/admin/users');
      router.refresh();
    } catch (err) {
      notify.error(getErrorMessage(err, 'Login failed'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200/50 p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-xl border border-base-300 bg-base-100 p-6 shadow-sm">
        <div>
          <h1 className="text-lg font-semibold text-base-content">Admin sign in</h1>
          <p className="text-sm text-base-content/60">Restricted area.</p>
        </div>
        <input className={inputCls} type="email" placeholder="Email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className={inputCls} type="password" placeholder="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Button type="submit" loading={loading} className="w-full">Sign in</Button>
      </form>
    </div>
  );
}