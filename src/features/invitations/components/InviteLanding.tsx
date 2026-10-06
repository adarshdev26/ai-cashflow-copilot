'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { PrimaryButton } from '@/components/ui/Button';
import { ApiError } from '@/lib/api-client';
import { notify, getErrorMessage } from '@/lib/ui/toast';
import { invitationKeys, useInvitationPreview } from '../hooks/use-invitations';
import { ROLE_LABELS } from '../utils';
import { InviteAcceptCard } from './InviteAcceptCard';
import { InviteRegisterForm } from './InviteRegisterForm';

function Shell({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle?: string;
    children?: React.ReactNode;
}) {
    return (
        <div className="bg-base-100 text-base-content flex min-h-screen items-center justify-center px-4">
            <div className="border-base-300 bg-base-200 w-full max-w-md space-y-6 rounded-xl border p-8 shadow-2xl">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                    {subtitle && <p className="text-base-content/50 mt-1 text-sm">{subtitle}</p>}
                </div>
                {children}
            </div>
        </div>
    );
}

const ERROR_TITLES: Record<string, string> = {
    INVALID: 'Invalid invitation',
    EXPIRED: 'Invitation expired',
    ACCEPTED: 'Invitation already used',
    CANCELLED: 'Invitation cancelled',
    INVITER_NOT_ALLOWED: 'Invitation no longer valid',
};

export function InviteLanding({ token }: { token: string }) {
    const queryClient = useQueryClient();
    const { data, error, isLoading, refetch } = useInvitationPreview(token);
    const [loggingOut, setLoggingOut] = useState(false);

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            const res = await fetch('/api/auth/logout', { method: 'POST' });
            if (!res.ok) throw new Error('Could not log out');
            // Drop data that belonged to the previous user, then re-check who is viewing.
            queryClient.removeQueries({ queryKey: ['current-user'] });
            queryClient.removeQueries({ queryKey: ['workspaces'] });
            await queryClient.invalidateQueries({ queryKey: invitationKeys.preview(token) });
        } catch (err) {
            notify.error(getErrorMessage(err, 'Could not log out'));
        } finally {
            setLoggingOut(false);
        }
    };

    if (isLoading) {
        return (
            <Shell title="Loading invitation...">
                <div className="bg-base-300 h-10 animate-pulse rounded-lg" />
            </Shell>
        );
    }

    if (error || !data) {
        const code = error instanceof ApiError ? error.code : undefined;
        const final = error instanceof ApiError && error.status < 500 && !!code;
        return (
            <Shell
                title={(code && ERROR_TITLES[code]) || 'Something went wrong'}
                subtitle={getErrorMessage(error, 'We could not load this invitation.')}
            >
                {final ? (
                    <Link href="/login" className="text-primary text-sm hover:underline">
                        Go to sign in
                    </Link>
                ) : (
                    <PrimaryButton type="button" onClick={() => refetch()} className="w-full">
                        Try again
                    </PrimaryButton>
                )}
            </Shell>
        );
    }

    const title = `Join ${data.workspaceName}`;
    const subtitle = `You were invited as ${ROLE_LABELS[data.role]} (${data.email}).`;

    // Signed in as the invited email: one click to accept.
    if (data.viewer.signedIn && data.viewer.emailMatches) {
        return (
            <Shell title={title} subtitle={subtitle}>
                <InviteAcceptCard token={token} email={data.email} />
            </Shell>
        );
    }

    // Signed in as someone else: never accept silently.
    if (data.viewer.signedIn) {
        return (
            <Shell title={title} subtitle={subtitle}>
                <div className="bg-warning/10 border-warning/20 rounded border p-3 text-sm text-yellow-300">
                    You are signed in with a different account. This invitation was sent to{' '}
                    <span className="font-medium">{data.email}</span>. Log out to continue with that
                    email.
                </div>
                <PrimaryButton
                    type="button"
                    onClick={handleLogout}
                    loading={loggingOut}
                    className="w-full"
                >
                    Log out
                </PrimaryButton>
            </Shell>
        );
    }

    // Signed out, and the invited email already has an account.
    if (data.accountExists) {
        return (
            <Shell title={title} subtitle={subtitle}>
                <p className="text-base-content/50 text-sm">
                    An account already exists for this email. Sign in to accept the invitation.
                </p>
                <Link
                    href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`}
                    className="bg-primary text-primary-content hover:bg-primary block w-full rounded-lg px-4 py-2.5 text-center text-sm font-medium"
                >
                    Sign in to accept
                </Link>
            </Shell>
        );
    }

    // Signed out, no account yet.
    return (
        <Shell title={title} subtitle={subtitle}>
            <InviteRegisterForm token={token} email={data.email} />
        </Shell>
    );
}
