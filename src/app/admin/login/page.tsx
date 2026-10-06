'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AuthShell } from '@/components/auth/AuthShell';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { PrimaryButton } from '@/components/ui/Button';
import { PageTransitionOverlay } from '@/components/ui/PageTransitionOverlay';
import { authInputCls } from '@/components/ui/inputs';
import { apiFetch } from '@/lib/api-client';
import { notify, getErrorMessage } from '@/lib/ui/toast';

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const submit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            setError('');
            setLoading(true);
            try {
                await apiFetch('/api/admin/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, password }),
                });
                router.prefetch('/admin/dashboard');
                router.replace('/admin/dashboard');
            } catch (err) {
                const message = getErrorMessage(err, 'Login failed');
                setError(message);
                notify.error(message);
                setLoading(false);
            }
        },
        [email, password, router],
    );

    return (
        <AuthShell>
            <PageTransitionOverlay isVisible={loading} message="Signing in…" />
            <div className="border-base-300 bg-base-100 w-full max-w-md rounded-xl border p-8 shadow-2xl">
                <h1 className="text-base-content mb-2 text-2xl font-bold tracking-tight">
                    Admin sign in
                </h1>
                <p className="text-base-content/60 mb-6 text-sm">
                    Sign in to manage users and workspaces.
                </p>
                {error && (
                    <div
                        role="alert"
                        className="border-error/20 bg-error/10 text-error mb-4 rounded border p-3 text-sm"
                    >
                        {error}
                    </div>
                )}
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="admin-login-email"
                            className="text-base-content/70 mb-1 block text-sm font-medium"
                        >
                            Email
                        </label>
                        <input
                            id="admin-login-email"
                            type="email"
                            autoFocus
                            autoComplete="username"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className={authInputCls}
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="admin-login-password"
                            className="text-base-content/70 mb-1 block text-sm font-medium"
                        >
                            Password
                        </label>
                        <PasswordInput
                            id="admin-login-password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className={authInputCls}
                        />
                    </div>
                    <PrimaryButton type="submit" loading={loading} className="w-full">
                        Sign in
                    </PrimaryButton>
                </form>
            </div>
        </AuthShell>
    );
}
