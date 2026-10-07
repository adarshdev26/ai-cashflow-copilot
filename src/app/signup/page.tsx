'use client';

import { Suspense, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Lock, UserPlus, Ban } from 'lucide-react';
import { PrimaryButton } from '@/components/ui/Button';
import { notify, getErrorMessage } from '@/lib/ui/toast';
import { getSafeNextPath } from '@/lib/auth/safe-redirect';
import { AuthShell } from '@/components/auth/AuthShell';
import {
    AuthAlert,
    AuthField,
    BenefitsPanel,
    PasswordStrength,
    SplitAuthLayout,
} from '@/components/auth/AuthUI';
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

    const signupDisabled = settings?.['auth.signupEnabled'] === false;

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
            <SplitAuthLayout panel={<BenefitsPanel />} panelSide="left">
                <div className="bg-primary/10 text-primary mb-4 flex h-11 w-11 items-center justify-center rounded-xl">
                    <UserPlus className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">Create your account</h2>
                <p className="text-base-content/60 mt-1 mb-6 text-sm">
                    Join today and take control of your cashflow.
                </p>

                {signupDisabled ? (
                    <div
                        role="status"
                        className="bg-base-200 text-base-content/70 flex items-start gap-3 rounded-lg p-4 text-sm"
                    >
                        <Ban className="mt-0.5 h-4 w-4 shrink-0" />
                        New account signups are currently disabled.
                    </div>
                ) : (
                    <>
                        {error && <AuthAlert>{error}</AuthAlert>}
                        <form onSubmit={handleSignup} className="space-y-4">
                            <AuthField
                                id="signup-name"
                                label="Full name"
                                uppercaseLabel
                                icon={User}
                                value={name}
                                onChange={setName}
                                placeholder="John Doe"
                                autoComplete="name"
                                required
                            />
                            <AuthField
                                id="signup-email"
                                label="Email"
                                uppercaseLabel
                                icon={Mail}
                                type="email"
                                value={email}
                                onChange={setEmail}
                                placeholder="you@example.com"
                                autoComplete="email"
                                required
                            />
                            <AuthField
                                id="signup-password"
                                label="Password"
                                uppercaseLabel
                                icon={Lock}
                                type="password"
                                value={password}
                                onChange={setPassword}
                                placeholder="Create a password"
                                autoComplete="new-password"
                                required
                                hint={<PasswordStrength password={password} />}
                            />
                            <PrimaryButton type="submit" loading={loading} className="w-full">
                                Create Account
                            </PrimaryButton>
                        </form>
                    </>
                )}

                <p className="text-base-content/60 mt-6 text-center text-sm">
                    Already have an account?{' '}
                    <Link href={loginHref} className="text-primary font-medium hover:underline">
                        Log in
                    </Link>
                </p>
            </SplitAuthLayout>
        </AuthShell>
    );
}
