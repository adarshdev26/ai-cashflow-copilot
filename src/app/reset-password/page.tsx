'use client';

import { Suspense, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, LockKeyhole, LinkIcon, ShieldCheck } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';
import {
    AuthAlert,
    AuthField,
    PasswordChecklistPanel,
    RecoveryPanel,
    SplitAuthLayout,
} from '@/components/auth/AuthUI';
import { PrimaryButton } from '@/components/ui/Button';
import { notify, getErrorMessage } from '@/lib/ui/toast';
import { validatePassword } from '@/lib/validations/auth';
import { usePublicSettings } from '@/features/settings/hooks/use-settings';

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
                <SplitAuthLayout panel={<RecoveryPanel step={0} showBrand />} panelSide="left">
                    <div className="bg-error/10 text-error mb-4 flex h-11 w-11 items-center justify-center rounded-xl">
                        <LinkIcon className="h-5 w-5" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">Invalid link</h2>
                    <p className="text-base-content/70 mt-2 text-sm">
                        This reset link is missing or incomplete.
                    </p>
                    <Link
                        href="/forgot-password"
                        className="text-primary mt-6 inline-block text-sm font-medium hover:underline"
                    >
                        Request a new link
                    </Link>
                </SplitAuthLayout>
            </AuthShell>
        );
    }

    return (
        <AuthShell>
            <SplitAuthLayout
                panel={<PasswordChecklistPanel password={password} minLength={minPasswordLength} />}
                panelSide="left"
            >
                <div className="bg-primary/10 text-primary mb-4 flex h-11 w-11 items-center justify-center rounded-xl">
                    <LockKeyhole className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">Set a new password</h2>
                <p className="text-base-content/60 mt-1 mb-6 text-sm">
                    Choose a strong password you haven&apos;t used before.
                </p>

                {error && (
                    <AuthAlert>
                        {error}
                        {error.includes('invalid or has expired') && (
                            <>
                                {' '}
                                <Link href="/forgot-password" className="underline">
                                    Request a new link
                                </Link>
                            </>
                        )}
                    </AuthAlert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <AuthField
                        id="reset-password"
                        label="New password"
                        uppercaseLabel
                        icon={Lock}
                        type="password"
                        value={password}
                        onChange={setPassword}
                        placeholder="New password"
                        autoComplete="new-password"
                        required
                        hint={
                            <p className="text-base-content/50 mt-1.5 text-xs">
                                At least {minPasswordLength} characters.
                            </p>
                        }
                    />
                    <AuthField
                        id="reset-confirm-password"
                        label="Confirm password"
                        uppercaseLabel
                        icon={ShieldCheck}
                        type="password"
                        value={confirm}
                        onChange={setConfirm}
                        placeholder="Repeat new password"
                        autoComplete="new-password"
                        required
                    />
                    <PrimaryButton type="submit" loading={loading} className="w-full">
                        Update password
                    </PrimaryButton>
                </form>
            </SplitAuthLayout>
        </AuthShell>
    );
}
