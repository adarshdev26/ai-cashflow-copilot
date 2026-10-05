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
  const passwordError = password.length > 0 && password.length < 8 ? 'Password must be at least 8 characters.' : '';
  const close = () => { if (!pending) onClose(); };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitted(true);
    if (password.length < 8) return;
    try { await resetPassword.mutateAsync({ id: user.id, password }); notify.success('Password updated. The user was signed out everywhere.'); onClose(); }
    catch (err) { notify.error(getErrorMessage(err, 'Failed to reset password')); }
  };
  return <Modal open onClose={close} closeOnBackdrop={!pending} title="Reset password" description={`Set a new password for ${user.email}. The user will be signed out everywhere.`} footer={<>
    <Button variant="secondary" onClick={close} disabled={pending}>Cancel</Button><Button type="submit" form="admin-reset-password" loading={pending}>Update</Button>
  </>}>
    <form id="admin-reset-password" onSubmit={submit} noValidate className="space-y-2">
      <label htmlFor="admin-reset-password-input" className="block text-sm font-medium text-base-content/80">New password</label>
      <PasswordInput id="admin-reset-password-input" autoFocus autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={pending} aria-invalid={!!passwordError} className="w-full rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
      {(passwordError || (submitted && !password)) && <p className="text-xs text-error">{passwordError || 'Enter a new password.'}</p>}
      <p className="text-xs text-base-content/60">Use at least 8 characters.</p>
    </form>
  </Modal>;
}
