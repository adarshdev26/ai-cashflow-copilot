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
  'w-full rounded-lg bg-base-100 border border-base-300 px-4 py-2.5 text-base-content focus:border-primary focus:outline-none disabled:opacity-60';

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
          <p className="mt-1 text-sm text-base-content/50">
            You can invite people to collaborate with you. This step is optional.
          </p>
        </div>

        {error && (
          <div className="rounded border border-error/20 bg-error/10 p-3 text-sm text-error">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="invite-email" className="mb-1 block text-sm font-medium text-base-content/50">
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
          <label htmlFor="invite-role" className="mb-1 block text-sm font-medium text-base-content/50">
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
          <p className="mt-1 text-xs text-base-content/60">{ROLE_DESCRIPTIONS[role]}</p>
        </div>

        <PrimaryButton type="submit" loading={isPending} className="w-full">
          Send Invitation
        </PrimaryButton>

        {sentCount > 0 && (
          <p className="text-center text-xs text-base-content/50">
            {sentCount} invitation{sentCount > 1 ? 's' : ''} created. You can add more, or continue.
          </p>
        )}

        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={onBack}
            disabled={isPending}
            className="text-sm text-base-content/50 hover:text-base-content disabled:opacity-50"
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
              className="text-sm text-base-content/50 hover:text-base-content disabled:opacity-50"
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
