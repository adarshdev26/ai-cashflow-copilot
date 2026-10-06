'use client';

import { Suspense, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PrimaryButton } from '@/components/ui/Button';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { notify, getErrorMessage } from '@/lib/ui/toast';
import { getSafeNextPath } from '@/lib/auth/safe-redirect';
import { AuthShell } from '@/components/auth/AuthShell';
import { authInputCls } from '@/components/ui/inputs';

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginForm />
        </Suspense>
    );
}

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const nextPath = getSafeNextPath(searchParams.get('next'));
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            setError('');
            setLoading(true);

            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || 'Something went wrong');
                }

                notify.success('Welcome back!');
                router.push(nextPath ?? '/dashboard');
            } catch (err) {
                const message = getErrorMessage(err, 'Login failed');
                setError(message);
                notify.error(message);
            } finally {
                setLoading(false);
            }
        },
        [router, email, password, nextPath],
    );

    return (
        <AuthShell>
            <div className="bg-base-100 border-base-300 w-full max-w-md rounded-xl border p-8 shadow-2xl">
                <h2 className="mb-6 text-2xl font-bold tracking-tight">Welcome Back</h2>
                {error && (
                    <div
                        role="alert"
                        className="bg-error/10 text-error border-error/20 mb-4 rounded border p-3 text-sm"
                    >
                        {error}
                    </div>
                )}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label
                            htmlFor="login-email"
                            className="text-base-content/70 mb-1 block text-sm font-medium"
                        >
                            Email
                        </label>
                        <input
                            id="login-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className={authInputCls}
                        />
                    </div>
                    <div>
                        <div className="mb-1 flex items-center justify-between">
                            <label
                                htmlFor="login-password"
                                className="text-base-content/70 block text-sm font-medium"
                            >
                                Password
                            </label>
                            <Link
                                href="/forgot-password"
                                className="text-primary text-xs hover:underline"
                            >
                                Forgot password?
                            </Link>
                        </div>
                        <PasswordInput
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                            id="login-password"
                            className={authInputCls}
                        />
                    </div>
                    <PrimaryButton type="submit" loading={loading} className="w-full">
                        Log In
                    </PrimaryButton>
                </form>
                <p className="text-base-content/60 mt-4 text-center text-sm">
                    Don&apos;t have an account?{' '}
                    <Link
                        href={nextPath ? `/signup?next=${encodeURIComponent(nextPath)}` : '/signup'}
                        className="text-primary hover:underline"
                    >
                        Sign up
                    </Link>
                </p>
            </div>
        </AuthShell>
    );
}
