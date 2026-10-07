'use client';

import { Suspense, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock } from 'lucide-react';
import { PrimaryButton } from '@/components/ui/Button';
import { notify, getErrorMessage } from '@/lib/ui/toast';
import { getSafeNextPath } from '@/lib/auth/safe-redirect';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthAlert, AuthField, ShowcasePanel, SplitAuthLayout } from '@/components/auth/AuthUI';

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
    const [remember, setRemember] = useState(true);
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
            <SplitAuthLayout panel={<ShowcasePanel />} panelSide="right">
                <h2 className="text-2xl font-bold tracking-tight">Log in to your Account</h2>
                <p className="text-base-content/60 mt-1 mb-6 text-sm">
                    Welcome back! Enter your details to log in.
                </p>

                {error && <AuthAlert>{error}</AuthAlert>}

                <form onSubmit={handleLogin} className="space-y-4">
                    <AuthField
                        id="login-email"
                        label="Email"
                        hideLabel
                        icon={Mail}
                        type="email"
                        value={email}
                        onChange={setEmail}
                        placeholder="Email"
                        autoComplete="email"
                        required
                    />
                    <AuthField
                        id="login-password"
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

                    <div className="flex items-center justify-between">
                        <label className="text-base-content/60 flex cursor-pointer items-center gap-2 text-xs">
                            <input
                                type="checkbox"
                                checked={remember}
                                onChange={(e) => setRemember(e.target.checked)}
                                className="checkbox checkbox-primary checkbox-xs"
                            />
                            Remember me
                        </label>
                        <Link
                            href="/forgot-password"
                            className="text-primary text-xs font-medium hover:underline"
                        >
                            Forgot Password?
                        </Link>
                    </div>

                    <PrimaryButton type="submit" loading={loading} className="w-full">
                        Log In
                    </PrimaryButton>
                </form>

                <p className="text-base-content/60 mt-6 text-center text-sm">
                    Don&apos;t have an account?{' '}
                    <Link
                        href={nextPath ? `/signup?next=${encodeURIComponent(nextPath)}` : '/signup'}
                        className="text-primary font-medium hover:underline"
                    >
                        Create an account
                    </Link>
                </p>
            </SplitAuthLayout>
        </AuthShell>
    );
}
