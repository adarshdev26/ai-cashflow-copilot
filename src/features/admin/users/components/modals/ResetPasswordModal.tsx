'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { notify, getErrorMessage } from '@/lib/ui/toast';
import { useAdminUserMutations } from '../../hooks/use-admin-users';
import type { AdminUserRow } from '../../types';

export function ResetPasswordModal({ user, onClose }: { user: AdminUserRow; onClose: () => void }) {
    const { resetPassword } = useAdminUserMutations();
    const [password, setPassword] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const pending = resetPassword.isPending;
    const passwordError =
        password.length > 0 && password.length < 8 ? 'Password must be at least 8 characters.' : '';
    const close = () => {
        if (!pending) onClose();
    };
    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        if (password.length < 8) return;
        try {
            await resetPassword.mutateAsync({ id: user.id, password });
            notify.success('Password updated. The user was signed out everywhere.');
            onClose();
        } catch (err) {
            notify.error(getErrorMessage(err, 'Failed to reset password'));
        }
    };
    return (
        <Modal
            open
            onClose={close}
            closeOnBackdrop={!pending}
            title="Reset password"
            description={`Set a new password for ${user.email}. The user will be signed out everywhere.`}
            footer={
                <>
                    <Button variant="secondary" onClick={close} disabled={pending}>
                        Cancel
                    </Button>
                    <Button type="submit" form="admin-reset-password" loading={pending}>
                        Update
                    </Button>
                </>
            }
        >
            <form id="admin-reset-password" onSubmit={submit} noValidate className="space-y-2">
                <label
                    htmlFor="admin-reset-password-input"
                    className="text-base-content/80 block text-sm font-medium"
                >
                    New password
                </label>
                <PasswordInput
                    id="admin-reset-password-input"
                    autoFocus
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={pending}
                    aria-invalid={!!passwordError}
                    className="border-base-300 bg-base-100 focus:border-primary focus:ring-primary/20 w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                />
                {(passwordError || (submitted && !password)) && (
                    <p className="text-error text-xs">{passwordError || 'Enter a new password.'}</p>
                )}
                <p className="text-base-content/60 text-xs">Use at least 8 characters.</p>
            </form>
        </Modal>
    );
}
