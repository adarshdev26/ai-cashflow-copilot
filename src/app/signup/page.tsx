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
import { usePublicSettings } from '@/features/settings/hooks/use-settings';

export default function SignupPage() {
    return (
        <Suspense fallback={null}>
            <SignupForm />
        </Suspense>
    );
}

function SignupForm() {
    const { data: settings } = usePublicSettings();
    const router = useRouter();
    const searchParams = useSearchParams();
    const nextPath = getSafeNextPath(searchParams.get('next'));
    const loginHref = nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : '/login';
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignup = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            setError('');
            setLoading(true);

            try {
                const res = await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password }),
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || 'Something went wrong');
                }

                notify.success('Account created. Please log in.');
                router.push(loginHref);
            } catch (err) {
                const message = getErrorMessage(err, 'Signup failed');
                setError(message);
                notify.error(message);
            } finally {
                setLoading(false);
            }
        },
        [router, name, email, password, loginHref],
    );

    return (
        <AuthShell>
            <div className="bg-base-100 border-base-300 w-full max-w-md rounded-xl border p-8 shadow-2xl">
                <h2 className="mb-6 text-2xl font-bold tracking-tight">Create Account</h2>
                {settings?.['auth.signupEnabled'] === false ? (
                    <div
                        role="status"
                        className="bg-base-200 text-base-content/70 rounded p-3 text-sm"
                    >
                        New account signups are currently disabled.
                    </div>
                ) : (
                    <>
                        {error && (
                            <div
                                role="alert"
                                className="bg-error/10 text-error border-error/20 mb-4 rounded border p-3 text-sm"
                            >
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleSignup} className="space-y-4">
                            <div>
                                <label
                                    htmlFor="signup-name"
                                    className="text-base-content/70 mb-1 block text-sm font-medium"
                                >
                                    Name
                                </label>
                                <input
                                    id="signup-name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className={authInputCls}
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="signup-email"
                                    className="text-base-content/70 mb-1 block text-sm font-medium"
                                >
                                    Email
                                </label>
                                <input
                                    id="signup-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className={authInputCls}
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="signup-password"
                                    className="text-base-content/70 mb-1 block text-sm font-medium"
                                >
                                    Password
                                </label>
                                <PasswordInput
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="new-password"
                                    required
                                    id="signup-password"
                                    className={authInputCls}
                                />
                            </div>
                            <PrimaryButton type="submit" loading={loading} className="w-full">
                                Sign Up
                            </PrimaryButton>
                        </form>
                    </>
                )}
                <p className="text-base-content/60 mt-4 text-center text-sm">
                    Already have an account?{' '}
                    <Link href={loginHref} className="text-primary hover:underline">
                        Log in
                    </Link>
                </p>
            </div>
        </AuthShell>
    );
}
