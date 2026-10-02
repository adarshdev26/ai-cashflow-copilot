'use client';

import { useState } from 'react';
import { PrimaryButton } from '@/components/ui/Button';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { useChangePassword } from '@/features/auth/hooks/use-change-password';
import { validatePassword } from '@/lib/validations/auth';
import { notify, getErrorMessage } from '@/lib/toast';

const inputCls =
  'w-full rounded-md border border-base-300 bg-base-100 px-3 py-2 text-sm text-base-content focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';

export function ChangePasswordSection() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const { mutate, isPending } = useChangePassword();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const pwError = validatePassword(next);
    if (pwError) return setError(pwError);
    if (next !== confirm) return setError('New passwords do not match');
    if (next === current) return setError('New password must be different from the current one');

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
      }
    );
  };

  return (
    <section className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-4 sm:p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-base-content">Password</h2>
        <p className="mt-1 text-sm text-base-content/60">
          Changing your password signs you out on all other devices.
        </p>
      </div>

      {error && (
        <div className="rounded bg-error/10 p-3 text-sm text-error border border-error/20">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-base-content/70">Current password</label>
            <PasswordInput
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password"
              required
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-base-content/70">New password</label>
            <PasswordInput
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
              required
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2 md:col-span-1">
            <label className="mb-1 block text-sm font-medium text-base-content/70">Confirm new password</label>
            <PasswordInput
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
              className={inputCls}
            />
          </div>
        </div>

        <p className="text-xs text-base-content/50">At least 8 characters.</p>

        <div className="flex justify-end">
          <PrimaryButton type="submit" loading={isPending}>
            Update password
          </PrimaryButton>
        </div>
      </form>
    </section>
  );
}