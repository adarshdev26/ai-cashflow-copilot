'use client';

import { useState } from 'react';
import { PrimaryButton } from '@/components/ui/Button';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { useChangePassword } from '@/features/auth/hooks/use-change-password';
import { validatePassword } from '@/lib/validations/auth';
import { notify, getErrorMessage } from '@/lib/ui/toast';
import { settingsInputCls } from '@/components/ui/inputs';
import { usePublicSettings } from '@/features/settings/hooks/use-settings';

export function ChangePasswordSection() {
    const { data: settings } = usePublicSettings();
    const [current, setCurrent] = useState('');
    const [next, setNext] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const { mutate, isPending } = useChangePassword();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const pwError = validatePassword(next, Number(settings?.['auth.passwordMinLength'] ?? 8));
        if (pwError) return setError(pwError);
        if (next !== confirm) return setError('New passwords do not match');
        if (next === current)
            return setError('New password must be different from the current one');

        mutate(
            { currentPassword: current, newPassword: next },
            {
                onSuccess: () => {
                    setCurrent('');
                    setNext('');
                    setConfirm('');
                    notify.success('Password updated. Other devices were signed out.');
                },
                onError: (err) => setError(getErrorMessage(err, 'Failed to update password')),
            },
        );
    };

    return (
        <section className="bg-base-100 border-base-300 space-y-4 rounded-xl border p-4 shadow-sm sm:p-6">
            <div>
                <h2 className="text-base-content text-lg font-semibold">Password</h2>
                <p className="text-base-content/60 mt-1 text-sm">
                    Changing your password signs you out on all other devices.
                </p>
            </div>

            {error && (
                <div
                    role="alert"
                    className="bg-error/10 text-error border-error/20 rounded border p-3 text-sm"
                >
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                    <div>
                        <label
                            htmlFor="current-password"
                            className="text-base-content/70 mb-1 block text-sm font-medium"
                        >
                            Current password
                        </label>
                        <PasswordInput
                            value={current}
                            onChange={(e) => setCurrent(e.target.value)}
                            autoComplete="current-password"
                            required
                            id="current-password"
                            className={settingsInputCls}
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="new-password"
                            className="text-base-content/70 mb-1 block text-sm font-medium"
                        >
                            New password
                        </label>
                        <PasswordInput
                            value={next}
                            onChange={(e) => setNext(e.target.value)}
                            autoComplete="new-password"
                            required
                            id="new-password"
                            className={settingsInputCls}
                        />
                    </div>
                    <div className="sm:col-span-2 md:col-span-1">
                        <label
                            htmlFor="confirm-password"
                            className="text-base-content/70 mb-1 block text-sm font-medium"
                        >
                            Confirm new password
                        </label>
                        <PasswordInput
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            autoComplete="new-password"
                            required
                            id="confirm-password"
                            className={settingsInputCls}
                        />
                    </div>
                </div>

                <p className="text-base-content/50 text-xs">At least 8 characters.</p>

                <div className="flex justify-end">
                    <PrimaryButton type="submit" loading={isPending}>
                        Update password
                    </PrimaryButton>
                </div>
            </form>
        </section>
    );
}
