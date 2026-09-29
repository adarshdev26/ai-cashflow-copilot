'use client';

import { useState } from 'react';
import { PrimaryButton } from '@/components/ui/Button';
import { notify, getErrorMessage } from '@/lib/toast';
import { ROLE_DESCRIPTIONS } from '@/features/workspaces/permissions';
import {
  InvitationLinkCard,
  type IssuedInvitationLink,
} from '@/features/invitations/components/InvitationLinkCard';
import { useCreateInvitation } from '@/features/invitations/hooks/use-invitations';
import { INVITABLE_ROLES, type InvitableRole } from '@/features/invitations/types';
import { ROLE_LABELS } from '@/features/invitations/utils';

type Props = {
  /** Always the workspace the user OWNS, never the active/invited one. */
  workspaceId: string;
  onBack: () => void;
  onNext: () => void;
};

const fieldClass =
  'w-full rounded-lg bg-gray-950 border border-gray-800 px-4 py-2.5 text-white focus:border-indigo-500 focus:outline-none disabled:opacity-60';

export function StepInviteMembers({ workspaceId, onBack, onNext }: Props) {
  const { mutate: createInvite, isPending } = useCreateInvitation();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<InvitableRole>('VIEWER');
  const [error, setError] = useState('');
  const [link, setLink] = useState<IssuedInvitationLink | null>(null);
  const [sentCount, setSentCount] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return; // no double submits

    const trimmed = email.trim();
    if (!trimmed) {
      setError('Enter an email address');
      return;
    }
    setError('');

    createInvite(
      { workspaceId, email: trimmed, role },
      {
        onSuccess: ({ invitation, token }) => {
          setEmail('');
          setRole('VIEWER');
          setSentCount((c) => c + 1);
          notify.success('Invitation created');
          setLink({ email: invitation.email, token, expiresAt: invitation.expiresAt });
        },
        onError: (err) => {
          const message = getErrorMessage(err, 'Failed to create invitation');
          setError(message);
          notify.error(message);
        },
      }
    );
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Invite your team</h2>
          <p className="mt-1 text-sm text-gray-400">
            You can invite people to collaborate with you. This step is optional.
          </p>
        </div>

        {error && (
          <div className="rounded border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="invite-email" className="mb-1 block text-sm font-medium text-gray-400">
            Email address
          </label>
          <input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isPending}
            placeholder="colleague@example.com"
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="invite-role" className="mb-1 block text-sm font-medium text-gray-400">
            Role
          </label>
          <select
            id="invite-role"
            value={role}
            onChange={(e) => setRole(e.target.value as InvitableRole)}
            disabled={isPending}
            className={fieldClass}
          >
            {INVITABLE_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">{ROLE_DESCRIPTIONS[role]}</p>
        </div>

        <PrimaryButton type="submit" loading={isPending} className="w-full">
          Send Invitation
        </PrimaryButton>

        {sentCount > 0 && (
          <p className="text-center text-xs text-gray-400">
            {sentCount} invitation{sentCount > 1 ? 's' : ''} created. You can add more, or continue.
          </p>
        )}

        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={onBack}
            disabled={isPending}
            className="text-sm text-gray-400 hover:text-white disabled:opacity-50"
          >
            Back
          </button>

          {sentCount > 0 ? (
            <PrimaryButton type="button" onClick={onNext} disabled={isPending}>
              Continue
            </PrimaryButton>
          ) : (
            <button
              type="button"
              onClick={onNext}
              disabled={isPending}
              className="text-sm text-gray-400 hover:text-white disabled:opacity-50"
            >
              I&apos;ll do this later
            </button>
          )}
        </div>
      </form>

      {/* Existing modal: shows the one-time invite link with a copy button */}
      <InvitationLinkCard link={link} onDismiss={() => setLink(null)} />
    </>
  );
}