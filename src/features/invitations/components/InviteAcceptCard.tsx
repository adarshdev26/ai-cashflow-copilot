'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PrimaryButton } from '@/components/ui/Button';
import { ApiError } from '@/lib/api-client';
import { notify, getErrorMessage } from '@/lib/toast';
import { useAcceptInvitation } from '../hooks/use-invitations';
import { setActiveWorkspaceId } from '../utils';

type Props = { token: string; email: string };

export function InviteAcceptCard({ token, email }: Props) {
  const router = useRouter();
  const { mutate: accept, isPending } = useAcceptInvitation();
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);

  const handleAccept = () => {
    setError(null);
    accept(token, {
      onSuccess: ({ workspaceId }) => {
        setActiveWorkspaceId(workspaceId);
        notify.success('You have joined the workspace');
        router.replace('/dashboard');
      },
      onError: (err) =>
        setError({
          message: getErrorMessage(err, 'Failed to accept invitation'),
          code: err instanceof ApiError ? err.code : undefined,
        }),
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-base-content/50">
        You are signed in as <span className="text-base-content">{email}</span>.
      </p>
      {error && (
        <div className="rounded bg-error/10 p-3 text-sm text-error border border-error/20">
          {error.message}
          {error.code === 'ALREADY_MEMBER' && (
            <>
              {' '}
              <Link href="/dashboard" className="text-primary hover:underline">
                Go to dashboard
              </Link>
            </>
          )}
        </div>
      )}
      <PrimaryButton type="button" onClick={handleAccept} loading={isPending} className="w-full">
        Accept invitation
      </PrimaryButton>
    </div>
  );
}
