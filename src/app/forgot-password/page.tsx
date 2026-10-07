'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, KeyRound, Mail, MailCheck } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthAlert, AuthField, RecoveryPanel, SplitAuthLayout } from '@/components/auth/AuthUI';
import { PrimaryButton } from '@/components/ui/Button';
import { notify, getErrorMessage } from '@/lib/ui/toast';
import { usePublicSettings } from '@/features/settings/hooks/use-settings';

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
            <SplitAuthLayout panel={<RecoveryPanel step={sent ? 1 : 0} />} panelSide="right">
                {sent ? (
                    <>
                        <div className="bg-success/10 text-success mb-4 flex h-11 w-11 items-center justify-center rounded-xl">
                            <MailCheck className="h-5 w-5" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight">Check your inbox</h2>
                        <p className="text-base-content/70 mt-2 text-sm">
                            If an account exists for{' '}
                            <span className="text-base-content font-medium">{email}</span>, a reset
                            link has been sent. The link expires in{' '}
                            {settings?.['auth.passwordResetExpiryMinutes'] ?? 30} minutes.
                        </p>
                        <button
                            type="button"
                            onClick={() => setSent(false)}
                            className="text-primary mt-6 text-sm font-medium hover:underline"
                        >
                            Use a different email
                        </button>
                        <Link
                            href="/login"
                            className="text-base-content/60 hover:text-base-content mt-4 inline-flex w-full items-center gap-1.5 text-sm"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to log in
                        </Link>
                    </>
                ) : (
                    <>
                        <div className="bg-primary/10 text-primary mb-4 flex h-11 w-11 items-center justify-center rounded-xl">
                            <KeyRound className="h-5 w-5" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight">Forgot password?</h2>
                        <p className="text-base-content/60 mt-1 mb-6 text-sm">
                            Enter your email and we&apos;ll send you a link to reset your password.
                        </p>

                        {error && <AuthAlert>{error}</AuthAlert>}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <AuthField
                                id="forgot-email"
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
                            <PrimaryButton type="submit" loading={loading} className="w-full">
                                Send reset link
                            </PrimaryButton>
                        </form>

                        <p className="text-base-content/60 mt-6 text-center text-sm">
                            Remembered it?{' '}
                            <Link
                                href="/login"
                                className="text-primary font-medium hover:underline"
                            >
                                Log in
                            </Link>
                        </p>
                    </>
                )}
            </SplitAuthLayout>
        </AuthShell>
    );
}
