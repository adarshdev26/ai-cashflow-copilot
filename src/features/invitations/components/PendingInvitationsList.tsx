'use client';

import { useState } from 'react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { notify, getErrorMessage } from '@/lib/ui/toast';
import { useCancelInvitation, useInvitations, useResendInvitation } from '../hooks/use-invitations';
import { useNow } from '../hooks/use-now';
import type { Invitation } from '../types';
import { ROLE_LABELS, formatTimeLeft } from '../utils';
import type { IssuedInvitationLink } from './InvitationLinkCard';

type Props = {
    workspaceId: string;
    allowResend?: boolean;
    /** Called with the fresh link after a resend. */
    onLinkReady: (link: IssuedInvitationLink) => void;
    /** Lets the parent hide a link card whose invitation was just cancelled. */
    onCancelled?: (email: string) => void;
};

export function PendingInvitationsList({
    workspaceId,
    allowResend = true,
    onLinkReady,
    onCancelled,
}: Props) {
    const now = useNow();
    const [cancelTarget, setCancelTarget] = useState<Invitation | null>(null);
    const [cancelError, setCancelError] = useState<string | undefined>();

    const { data: invitations, isLoading, error } = useInvitations(workspaceId);
    const resend = useResendInvitation();
    const cancel = useCancelInvitation();

    const closeCancelDialog = () => {
        if (cancel.isPending) return; // don't dismiss mid-request (e.g. via Escape)
        setCancelTarget(null);
        setCancelError(undefined);
    };

    const handleResend = (inv: Invitation) => {
        resend.mutate(
            { workspaceId, invitationId: inv.id },
            {
                onSuccess: ({ invitation, token }) => {
                    notify.success('New invite link generated. The old link no longer works.');
                    onLinkReady({
                        email: invitation.email,
                        token,
                        expiresAt: invitation.expiresAt,
                    });
                },
                onError: (err) => notify.error(getErrorMessage(err, 'Failed to resend invitation')),
            },
        );
    };

    const handleConfirmCancel = () => {
        if (!cancelTarget) return;
        const target = cancelTarget;
        setCancelError(undefined);
        cancel.mutate(
            { workspaceId, invitationId: target.id },
            {
                onSuccess: () => {
                    setCancelTarget(null);
                    notify.success('Invitation cancelled');
                    onCancelled?.(target.email);
                },
                // Keep the dialog open and show the error inside it so the admin can retry.
                onError: (err) =>
                    setCancelError(getErrorMessage(err, 'Failed to cancel invitation')),
            },
        );
    };

    return (
        <>
            <div className="border-base-300 rounded-lg border">
                <div className="overflow-x-auto rounded-lg">
                    <table className="divide-base-300 min-w-full divide-y text-left text-sm">
                        <thead className="bg-base-200 text-base-content/60">
                            <tr>
                                <th className="px-4 py-3 font-medium">Email</th>
                                <th className="px-4 py-3 font-medium">Role</th>
                                <th className="px-4 py-3 font-medium">Expiry</th>
                                <th className="px-4 py-3 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-base-300 bg-base-100 divide-y">
                            {isLoading ? (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="text-base-content/60 animate-pulse px-4 py-8 text-center"
                                    >
                                        Loading invitations...
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={4} className="text-error px-4 py-8 text-center">
                                        {getErrorMessage(error, 'Failed to load invitations')}
                                    </td>
                                </tr>
                            ) : !invitations || invitations.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="text-base-content/60 px-4 py-8 text-center"
                                    >
                                        No pending invitations.
                                    </td>
                                </tr>
                            ) : (
                                invitations.map((inv) => {
                                    const timeLeft = formatTimeLeft(inv.expiresAt, now);
                                    const expired = timeLeft === 'Expired';
                                    const resending =
                                        resend.isPending &&
                                        resend.variables?.invitationId === inv.id;
                                    return (
                                        <tr key={inv.id}>
                                            <td className="text-base-content px-4 py-3 break-all">
                                                {inv.email}
                                            </td>
                                            <td className="text-base-content/80 px-4 py-3">
                                                {ROLE_LABELS[inv.role]}
                                            </td>
                                            <td
                                                className={`px-4 py-3 ${expired ? 'text-error font-medium' : 'text-base-content/70'}`}
                                            >
                                                {timeLeft}
                                            </td>
                                            <td className="space-x-4 px-4 py-3 text-right">
                                                {allowResend && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleResend(inv)}
                                                        disabled={resending}
                                                        className="text-primary hover:text-primary text-sm font-medium disabled:opacity-50"
                                                    >
                                                        {resending ? 'Resending...' : 'Resend'}
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setCancelError(undefined);
                                                        setCancelTarget(inv);
                                                    }}
                                                    className="text-error hover:text-error text-sm font-medium"
                                                >
                                                    Cancel
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmDialog
                isOpen={!!cancelTarget}
                title="Cancel invitation"
                description={`Cancel the invitation for ${cancelTarget?.email ?? ''}? Their link will stop working.`}
                confirmText="Cancel invitation"
                cancelText="Keep invitation"
                variant="danger"
                loading={cancel.isPending}
                error={cancelError}
                onConfirm={handleConfirmCancel}
                onClose={closeCancelDialog}
            />
        </>
    );
}
