'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { AuthShell } from '@/components/auth/AuthShell';
import { PrimaryButton } from '@/components/ui/Button';
import { notify, getErrorMessage } from '@/lib/ui/toast';
import { usePublicSettings } from '@/features/settings/hooks/use-settings';
import { authInputCls } from '@/components/ui/inputs';

export default function ForgotPasswordPage() {
    const { data: settings } = usePublicSettings();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            setError('');
            setLoading(true);
            try {
                const res = await fetch('/api/auth/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Something went wrong');
                setSent(true);
            } catch (err) {
                const message = getErrorMessage(err, 'Could not send reset link');
                setError(message);
                notify.error(message);
            } finally {
                setLoading(false);
            }
        },
        [email],
    );

    return (
        <AuthShell>
            <div className="bg-base-100 border-base-300 w-full max-w-md rounded-xl border p-8 shadow-2xl">
                <h2 className="mb-2 text-2xl font-bold tracking-tight">Forgot password?</h2>

                {sent ? (
                    <div className="space-y-4">
                        <p className="text-base-content/70 text-sm">
                            If an account exists for{' '}
                            <span className="text-base-content font-medium">{email}</span>, a reset
                            link has been sent. The link expires in{' '}
                            {settings?.['auth.passwordResetExpiryMinutes'] ?? 30} minutes.
                        </p>
                        <Link
                            href="/login"
                            className="text-primary block text-center text-sm hover:underline"
                        >
                            Back to log in
                        </Link>
                    </div>
                ) : (
                    <>
                        <p className="text-base-content/60 mb-6 text-sm">
                            Enter your email and we&apos;ll send you a link to reset your password.
                        </p>
                        {error && (
                            <div
                                role="alert"
                                className="bg-error/10 text-error border-error/20 mb-4 rounded border p-3 text-sm"
                            >
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label
                                    htmlFor="forgot-email"
                                    className="text-base-content/70 mb-1 block text-sm font-medium"
                                >
                                    Email
                                </label>
                                <input
                                    id="forgot-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                    className={authInputCls}
                                />
                            </div>
                            <PrimaryButton type="submit" loading={loading} className="w-full">
                                Send reset link
                            </PrimaryButton>
                        </form>
                        <p className="text-base-content/60 mt-4 text-center text-sm">
                            Remembered it?{' '}
                            <Link href="/login" className="text-primary hover:underline">
                                Log in
                            </Link>
                        </p>
                    </>
                )}
            </div>
        </AuthShell>
    );
}
