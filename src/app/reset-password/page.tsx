'use client';

import { Suspense, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AuthShell } from '@/components/auth/AuthShell';
import { PrimaryButton } from '@/components/ui/Button';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { notify, getErrorMessage } from '@/lib/ui/toast';
import { validatePassword } from '@/lib/validations/auth';
import { usePublicSettings } from '@/features/settings/hooks/use-settings';
import { authInputCls } from '@/components/ui/inputs';

export default function ResetPasswordPage() {
    const { data: settings } = usePublicSettings();
    return (
        <Suspense fallback={null}>
            <ResetPasswordForm
                minPasswordLength={Number(settings?.['auth.passwordMinLength'] ?? 8)}
            />
        </Suspense>
    );
}

function ResetPasswordForm({ minPasswordLength }: { minPasswordLength: number }) {
    const router = useRouter();
    const token = useSearchParams().get('token') ?? '';
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            setError('');

            const pwError = validatePassword(password, minPasswordLength);
            if (pwError) return setError(pwError);
            if (password !== confirm) return setError('Passwords do not match');

            setLoading(true);
            try {
                const res = await fetch('/api/auth/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, password }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Something went wrong');

                notify.success('Password updated. Please log in.');
                router.push('/login');
            } catch (err) {
                const message = getErrorMessage(err, 'Could not reset password');
                setError(message);
                notify.error(message);
            } finally {
                setLoading(false);
            }
        },
        [token, password, confirm, router, minPasswordLength],
    );

    if (!token) {
        return (
            <AuthShell>
                <div className="bg-base-100 border-base-300 w-full max-w-md space-y-4 rounded-xl border p-8 shadow-2xl">
                    <h2 className="text-2xl font-bold tracking-tight">Invalid link</h2>
                    <p className="text-base-content/70 text-sm">
                        This reset link is missing or incomplete.
                    </p>
                    <Link
                        href="/forgot-password"
                        className="text-primary block text-center text-sm hover:underline"
                    >
                        Request a new link
                    </Link>
                </div>
            </AuthShell>
        );
    }

    return (
        <AuthShell>
            <div className="bg-base-100 border-base-300 w-full max-w-md rounded-xl border p-8 shadow-2xl">
                <h2 className="mb-6 text-2xl font-bold tracking-tight">Set a new password</h2>
                {error && (
                    <div
                        role="alert"
                        className="bg-error/10 text-error border-error/20 mb-4 rounded border p-3 text-sm"
                    >
                        {error}
                        {error.includes('invalid or has expired') && (
                            <>
                                {' '}
                                <Link href="/forgot-password" className="underline">
                                    Request a new link
                                </Link>
                            </>
                        )}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="reset-password"
                            className="text-base-content/70 mb-1 block text-sm font-medium"
                        >
                            New password
                        </label>
                        <PasswordInput
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="new-password"
                            required
                            id="reset-password"
                            className={authInputCls}
                        />
                        <p className="text-base-content/50 mt-1 text-xs">At least 8 characters.</p>
                    </div>
                    <div>
                        <label
                            htmlFor="reset-confirm-password"
                            className="text-base-content/70 mb-1 block text-sm font-medium"
                        >
                            Confirm password
                        </label>
                        <PasswordInput
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            autoComplete="new-password"
                            required
                            id="reset-confirm-password"
                            className={authInputCls}
                        />
                    </div>
                    <PrimaryButton type="submit" loading={loading} className="w-full">
                        Update password
                    </PrimaryButton>
                </form>
            </div>
        </AuthShell>
    );
}
