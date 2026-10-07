'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ShieldCheck } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';
import { AdminPanel, AuthAlert, AuthField, SplitAuthLayout } from '@/components/auth/AuthUI';
import { PrimaryButton } from '@/components/ui/Button';
import { PageTransitionOverlay } from '@/components/ui/PageTransitionOverlay';
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
            {/* Same layout as the user login: form left, colour panel right */}
            <SplitAuthLayout panel={<AdminPanel />} panelSide="right">
                <span className="bg-primary/10 text-primary mb-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Admin
                </span>
                <h1 className="text-2xl font-bold tracking-tight">Admin sign in</h1>
                <p className="text-base-content/60 mt-1 mb-6 text-sm">
                    Sign in to manage users and workspaces.
                </p>

                {error && <AuthAlert>{error}</AuthAlert>}

                <form onSubmit={submit} className="space-y-4">
                    <AuthField
                        id="admin-login-email"
                        label="Email"
                        hideLabel
                        icon={Mail}
                        type="email"
                        value={email}
                        onChange={setEmail}
                        placeholder="Email"
                        autoComplete="username"
                        autoFocus
                        required
                    />
                    <AuthField
                        id="admin-login-password"
                        label="Password"
                        hideLabel
                        icon={Lock}
                        type="password"
                        value={password}
                        onChange={setPassword}
                        placeholder="Password"
                        autoComplete="current-password"
                        required
                    />
                    <PrimaryButton type="submit" loading={loading} className="w-full">
                        Sign in
                    </PrimaryButton>
                </form>

                <p className="text-base-content/60 mt-6 text-center text-sm">
                    Not an admin?{' '}
                    <Link href="/login" className="text-primary font-medium hover:underline">
                        Go to user login
                    </Link>
                </p>
            </SplitAuthLayout>
        </AuthShell>
    );
}
