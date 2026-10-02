'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { PrimaryButton } from '@/components/ui/Button';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { ApiError } from '@/lib/api-client';
import { notify, getErrorMessage } from '@/lib/toast';
import { invitationKeys, useRegisterViaInvitation } from '../hooks/use-invitations';
import { setActiveWorkspaceId } from '../utils';

type Props = { token: string; email: string };

const inputClass =
  'w-full rounded-lg bg-gray-950 border border-gray-800 px-4 py-2.5 text-white focus:border-primary focus:outline-none';

export function InviteRegisterForm({ token, email }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const ids = { email: useId(), name: useId(), password: useId(), confirm: useId() };
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const { mutate: register, isPending } = useRegisterViaInvitation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

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
            // Someone registered this email meanwhile: refresh so the page shows "Sign in".
            notify.error(err.message);
            queryClient.invalidateQueries({ queryKey: invitationKeys.preview(token) });
            return;
          }
          setError(getErrorMessage(err, 'Failed to create account'));
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded bg-error/10 p-3 text-sm text-red-400 border border-error/20">
          {error}
        </div>
      )}
      <div>
        <label htmlFor={ids.email} className="block text-sm font-medium text-base-content/50 mb-1">
          Email
        </label>
        <input
          id={ids.email}
          type="email"
          value={email}
          readOnly
          disabled
          className={`${inputClass} opacity-60 cursor-not-allowed`}
        />
      </div>
      <div>
        <label htmlFor={ids.name} className="block text-sm font-medium text-base-content/50 mb-1">
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
        <label htmlFor={ids.password} className="block text-sm font-medium text-base-content/50 mb-1">
          Password
        </label>
        <PasswordInput
          id={ids.password}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isPending}
          autoComplete="new-password"
          required
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor={ids.confirm} className="block text-sm font-medium text-base-content/50 mb-1">
          Confirm password
        </label>
        <PasswordInput
          id={ids.confirm}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          disabled={isPending}
          autoComplete="new-password"
          required
          className={inputClass}
        />
      </div>
      <PrimaryButton type="submit" loading={isPending} className="w-full">
        Create account and join
      </PrimaryButton>
    </form>
  );
}