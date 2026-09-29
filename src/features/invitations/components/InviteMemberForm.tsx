'use client';

import { useId, useState } from 'react';
import { notify, getErrorMessage } from '@/lib/toast';
import { useCreateInvitation } from '../hooks/use-invitations';
import { INVITABLE_ROLES, type InvitableRole } from '../types';
import { ROLE_LABELS } from '../utils';
import type { IssuedInvitationLink } from './InvitationLinkCard';

type Props = {
  workspaceId: string;
  onCreated: (link: IssuedInvitationLink) => void;
};

export function InviteMemberForm({ workspaceId, onCreated }: Props) {
  const emailId = useId();
  const roleId = useId();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<InvitableRole>('VIEWER');
  const { mutate: createInvite, isPending } = useCreateInvitation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    createInvite(
      { workspaceId, email: trimmed, role },
      {
        onSuccess: ({ invitation, token }) => {
          setEmail('');
          setRole('VIEWER');
          notify.success('Invitation created');
          onCreated({ email: invitation.email, token, expiresAt: invitation.expiresAt });
        },
        onError: (error) => notify.error(getErrorMessage(error, 'Failed to create invitation')),
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-4 max-w-2xl items-end">
      <div className="flex-1 space-y-1">
        <label htmlFor={emailId} className="text-xs font-medium text-slate-700">
          Email Address
        </label>
        <input
          id={emailId}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isPending}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50"
          placeholder="colleague@example.com"
          required
        />
      </div>
      <div className="w-32 space-y-1">
        <label htmlFor={roleId} className="text-xs font-medium text-slate-700">
          Role
        </label>
        <select
          id={roleId}
          value={role}
          onChange={(e) => setRole(e.target.value as InvitableRole)}
          disabled={isPending}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
        >
          {INVITABLE_ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={isPending || !email.trim()}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Inviting...' : 'Invite Member'}
      </button>
    </form>
  );
}