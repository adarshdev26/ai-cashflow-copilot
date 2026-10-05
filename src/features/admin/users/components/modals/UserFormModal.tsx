'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { notify, getErrorMessage } from '@/lib/ui/toast';
import { useAdminUserMutations } from '../../hooks/use-admin-users';
import type { AdminUserRow } from '../../types';

export function UserFormModal({ user, onClose }: { user: AdminUserRow | null; onClose: () => void }) {
  const { create, update } = useAdminUserMutations();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const pending = create.isPending || update.isPending;
  const emailError = email.trim() ? (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? 'Enter a valid email address.' : '') : (submitted ? 'Email is required.' : '');
  const passwordError = !user && (password.length > 0 && password.length < 8 ? 'Password must be at least 8 characters.' : submitted && !password ? 'Password is required.' : '');
  const close = () => { if (!pending) onClose(); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!email.trim() || emailError || (!user && password.length < 8)) return;
    try {
      if (user) { await update.mutateAsync({ id: user.id, name, email }); notify.success('User updated'); }
      else { await create.mutateAsync({ name, email, password }); notify.success('User created'); }
      onClose();
    } catch (err) { notify.error(getErrorMessage(err, 'Failed to save user')); }
  };

  return <Modal open onClose={close} closeOnBackdrop={!pending} title={user ? 'Edit user' : 'Add user'} footer={<>
    <Button variant="secondary" onClick={close} disabled={pending}>Cancel</Button><Button type="submit" form="admin-user-form" loading={pending}>{user ? 'Save' : 'Create'}</Button>
  </>}>
    <form id="admin-user-form" onSubmit={submit} noValidate className="space-y-3">
      <div><label htmlFor="admin-user-name" className="mb-1 block text-sm font-medium text-base-content/80">Name</label><Input id="admin-user-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} disabled={pending} className="bg-base-100" /></div>
      <div><label htmlFor="admin-user-email" className="mb-1 block text-sm font-medium text-base-content/80">Email</label><Input id="admin-user-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={pending} aria-invalid={!!(emailError && (submitted || email))} className="bg-base-100" />{emailError && <p className="mt-1 text-xs text-error">{emailError}</p>}</div>
      {!user && <div><label htmlFor="admin-user-password" className="mb-1 block text-sm font-medium text-base-content/80">Password</label><PasswordInput id="admin-user-password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={pending} aria-invalid={!!passwordError} className="w-full rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />{passwordError && <p className="mt-1 text-xs text-error">{passwordError}</p>}<p className="mt-1 text-xs text-base-content/60">Use at least 8 characters.</p></div>}
    </form>
  </Modal>;
}
