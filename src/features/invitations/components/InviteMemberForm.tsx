'use client';

import { useId, useState } from 'react';
import { notify, getErrorMessage } from '@/lib/ui/toast';
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
                onError: (error) =>
                    notify.error(getErrorMessage(error, 'Failed to create invitation')),
            },
        );
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="flex max-w-2xl flex-col items-end gap-4 sm:flex-row"
            data-tour="settings-invite-form"
        >
            <div className="min-w-0 flex-1 space-y-1">
                <label htmlFor={emailId} className="text-base-content/80 text-xs font-medium">
                    Email Address
                </label>
                <input
                    id={emailId}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isPending}
                    className="border-base-300 focus:border-primary focus:ring-primary disabled:bg-base-200 w-full rounded-md border px-3 py-2 text-base focus:ring-1 focus:outline-none sm:text-sm"
                    placeholder="colleague@example.com"
                    required
                />
            </div>
            <div className="w-full space-y-1 sm:w-32">
                <label htmlFor={roleId} className="text-base-content/80 text-xs font-medium">
                    Role
                </label>
                <select
                    id={roleId}
                    value={role}
                    onChange={(e) => setRole(e.target.value as InvitableRole)}
                    disabled={isPending}
                    className="border-base-300 focus:border-primary focus:ring-primary bg-base-100 w-full rounded-md border px-3 py-2 text-base focus:ring-1 focus:outline-none sm:text-sm"
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
                className="bg-primary text-primary-content hover:bg-primary w-full rounded-md px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
                {isPending ? 'Inviting...' : 'Invite Member'}
            </button>
        </form>
    );
}
