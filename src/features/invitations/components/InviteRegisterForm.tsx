'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { PrimaryButton } from '@/components/ui/Button';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { ApiError } from '@/lib/api-client';
import { notify, getErrorMessage } from '@/lib/ui/toast';
import { invitationKeys, useRegisterViaInvitation } from '../hooks/use-invitations';
import { setActiveWorkspaceId } from '../utils';

type Props = { token: string; email: string };

const inputClass =
    'w-full rounded-lg bg-base-100 border border-base-300 px-4 py-2.5 text-base-content focus:border-primary focus:outline-none';

export function InviteRegisterForm({ token, email }: Props) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const ids = { email: useId(), name: useId(), password: useId(), confirm: useId() };
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const { mutate: register, isPending } = useRegisterViaInvitation();

    const markTouched = (key: string) => setTouched((t) => (t[key] ? t : { ...t, [key]: true }));

    const passwordError = !password
        ? 'Enter a password'
        : password.length < 8
          ? 'Password must be at least 8 characters'
          : '';
    const confirmError = !confirm
        ? 'Confirm your password'
        : confirm !== password
          ? 'Passwords do not match'
          : '';
    const showPasswordError = Boolean((touched.password || submitted) && passwordError);
    const showConfirmError = Boolean((touched.confirm || submitted) && confirmError);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitted(true);
        if (passwordError || confirmError) return;

        register(
            { token, name: name.trim() || undefined, password },
            {
                onSuccess: ({ workspaceId }) => {
                    setActiveWorkspaceId(workspaceId);
                    notify.success('Account created. Welcome!');
                    router.replace('/dashboard');
                },
                onError: (err) => {
                    if (err instanceof ApiError && err.code === 'ACCOUNT_EXISTS') {
                        notify.error(err.message);
                        queryClient.invalidateQueries({ queryKey: invitationKeys.preview(token) });
                        return;
                    }
                    setError(getErrorMessage(err, 'Failed to create account'));
                },
            },
        );
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="bg-error/10 text-error border-error/20 rounded border p-3 text-sm">
                    {error}
                </div>
            )}
            <div>
                <label
                    htmlFor={ids.email}
                    className="text-base-content/50 mb-1 block text-sm font-medium"
                >
                    Email
                </label>
                <input
                    id={ids.email}
                    type="email"
                    value={email}
                    readOnly
                    disabled
                    className={`${inputClass} cursor-not-allowed opacity-60`}
                />
            </div>
            <div>
                <label
                    htmlFor={ids.name}
                    className="text-base-content/50 mb-1 block text-sm font-medium"
                >
                    Name
                </label>
                <input
                    id={ids.name}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isPending}
                    autoComplete="name"
                    className={inputClass}
                />
            </div>
            <div>
                <label
                    htmlFor={ids.password}
                    className="text-base-content/50 mb-1 block text-sm font-medium"
                >
                    Password
                </label>
                <PasswordInput
                    id={ids.password}
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        markTouched('password');
                        if (confirm) markTouched('confirm');
                    }}
                    disabled={isPending}
                    autoComplete="new-password"
                    required
                    aria-invalid={showPasswordError}
                    className={inputClass}
                />
                {showPasswordError && <p className="text-error mt-1 text-xs">{passwordError}</p>}
            </div>
            <div>
                <label
                    htmlFor={ids.confirm}
                    className="text-base-content/50 mb-1 block text-sm font-medium"
                >
                    Confirm password
                </label>
                <PasswordInput
                    id={ids.confirm}
                    value={confirm}
                    onChange={(e) => {
                        setConfirm(e.target.value);
                        markTouched('confirm');
                    }}
                    disabled={isPending}
                    autoComplete="new-password"
                    required
                    aria-invalid={showConfirmError}
                    className={inputClass}
                />
                {showConfirmError && <p className="text-error mt-1 text-xs">{confirmError}</p>}
            </div>
            <PrimaryButton type="submit" loading={isPending} className="w-full">
                Create account and join
            </PrimaryButton>
        </form>
    );
}
