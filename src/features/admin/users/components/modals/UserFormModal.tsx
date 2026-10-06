'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Select } from '@/components/ui/Select';
import { notify, getErrorMessage } from '@/lib/ui/toast';
import { useAdminUserMutations } from '../../hooks/use-admin-users';
import type { AdminUserRow } from '../../types';

export function UserFormModal({
    user,
    onClose,
}: {
    user: AdminUserRow | null;
    onClose: () => void;
}) {
    const { create, update } = useAdminUserMutations();
    const [name, setName] = useState(user?.name ?? '');
    const [email, setEmail] = useState(user?.email ?? '');
    const [plan, setPlan] = useState<'FREEMIUM' | 'PREMIUM'>(user?.plan ?? 'FREEMIUM');
    const [password, setPassword] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const pending = create.isPending || update.isPending;
    const emailError = email.trim()
        ? !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
            ? 'Enter a valid email address.'
            : ''
        : submitted
          ? 'Email is required.'
          : '';
    const passwordError =
        !user &&
        (password.length > 0 && password.length < 8
            ? 'Password must be at least 8 characters.'
            : submitted && !password
              ? 'Password is required.'
              : '');
    const close = () => {
        if (!pending) onClose();
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        if (!email.trim() || emailError || (!user && password.length < 8)) return;
        try {
            if (user) {
                await update.mutateAsync({ id: user.id, name, email, plan });
                notify.success('User updated');
            } else {
                await create.mutateAsync({ name, email, password });
                notify.success('User created');
            }
            onClose();
        } catch (err) {
            notify.error(getErrorMessage(err, 'Failed to save user'));
        }
    };

    return (
        <Modal
            open
            onClose={close}
            closeOnBackdrop={!pending}
            title={user ? 'Edit user' : 'Add user'}
            footer={
                <>
                    <Button variant="secondary" onClick={close} disabled={pending}>
                        Cancel
                    </Button>
                    <Button type="submit" form="admin-user-form" loading={pending}>
                        {user ? 'Save' : 'Create'}
                    </Button>
                </>
            }
        >
            <form id="admin-user-form" onSubmit={submit} noValidate className="space-y-3">
                <div>
                    <label
                        htmlFor="admin-user-name"
                        className="text-base-content/80 mb-1 block text-sm font-medium"
                    >
                        Name
                    </label>
                    <Input
                        id="admin-user-name"
                        autoFocus
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={pending}
                        className="bg-base-100"
                    />
                </div>
                <div>
                    <label
                        htmlFor="admin-user-email"
                        className="text-base-content/80 mb-1 block text-sm font-medium"
                    >
                        Email
                    </label>
                    <Input
                        id="admin-user-email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={pending}
                        aria-invalid={!!(emailError && (submitted || email))}
                        className="bg-base-100"
                    />
                    {emailError && <p className="text-error mt-1 text-xs">{emailError}</p>}
                </div>
                {user && (
                    <div>
                        <label
                            htmlFor="admin-user-plan"
                            className="text-base-content/80 mb-1 block text-sm font-medium"
                        >
                            Plan
                        </label>
                        <Select
                            id="admin-user-plan"
                            value={plan}
                            onChange={(e) =>
                                setPlan(e.target.value as 'FREEMIUM' | 'PREMIUM')
                            }
                        >
                            <option value="FREEMIUM">Free</option>
                            <option value="PREMIUM">Premium</option>
                        </Select>
                    </div>
                )}
                {!user && (
                    <div>
                        <label
                            htmlFor="admin-user-password"
                            className="text-base-content/80 mb-1 block text-sm font-medium"
                        >
                            Password
                        </label>
                        <PasswordInput
                            id="admin-user-password"
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={pending}
                            aria-invalid={!!passwordError}
                            className="border-base-300 bg-base-100 focus:border-primary focus:ring-primary/20 w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                        />
                        {passwordError && (
                            <p className="text-error mt-1 text-xs">{passwordError}</p>
                        )}
                        <p className="text-base-content/60 mt-1 text-xs">
                            Use at least 8 characters.
                        </p>
                    </div>
                )}
            </form>
        </Modal>
    );
}
