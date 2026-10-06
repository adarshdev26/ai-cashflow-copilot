'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { notify, getErrorMessage } from '@/lib/ui/toast';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import { WORKSPACE_ROLES, type WorkspaceRole } from '../../../shared/types';
import { useAdminWorkspace, useAdminMemberMutations } from '../../hooks/use-admin-workspaces';

type TransferTarget =
    | { kind: 'member'; userId: string; email: string; previousRole: WorkspaceRole }
    | { kind: 'add'; email: string; previousRole: WorkspaceRole };

export function WorkspaceMembersModal({
    workspaceId,
    onClose,
}: {
    workspaceId: string;
    onClose: () => void;
}) {
    const { data, isLoading, isError, error, refetch } = useAdminWorkspace(workspaceId);
    const { add, setRole, remove } = useAdminMemberMutations();
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [newRole, setNewRole] = useState<WorkspaceRole>('MEMBER');
    const [pendingKey, setPendingKey] = useState<string | null>(null);
    const [transfer, setTransfer] = useState<TransferTarget | null>(null);
    const [transferError, setTransferError] = useState<string | undefined>();
    const ws = data?.workspace;
    const close = () => {
        if (!pendingKey && !transfer) onClose();
    };

    const changeRole = async (
        userId: string,
        memberEmail: string,
        role: WorkspaceRole,
        previousRole: WorkspaceRole,
    ) => {
        console.log('[WorkspaceMembersModal] changeRole', { userId, role });
        if (role === 'OWNER') {
            setTransferError(undefined);
            setTransfer({ kind: 'member', userId, email: memberEmail, previousRole });
            return;
        }
        const key = `${workspaceId}:${userId}`;
        setPendingKey(key);
        try {
            await setRole.mutateAsync({ workspaceId, userId, role });
            notify.success('Role updated');
        } catch (err) {
            notify.error(getErrorMessage(err, 'Failed to update role'));
        } finally {
            setPendingKey(null);
        }
    };
    const removeMember = async (userId: string) => {
        console.log('[WorkspaceMembersModal] removeMember', { workspaceId, userId });
        const key = `${workspaceId}:${userId}`;
        setPendingKey(key);
        try {
            await remove.mutateAsync({ workspaceId, userId });
            notify.success('Member removed');
        } catch (err) {
            notify.error(getErrorMessage(err, 'Failed to remove member'));
        } finally {
            setPendingKey(null);
        }
    };
    const submitAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newRole === 'OWNER') {
            setTransferError(undefined);
            setTransfer({ kind: 'add', email, previousRole: newRole });
            return;
        }
        const key = `${workspaceId}:add`;
        setPendingKey(key);
        try {
            await add.mutateAsync({ workspaceId, email, role: newRole });
            notify.success('Member added');
            setEmail('');
        } catch (err) {
            notify.error(getErrorMessage(err, 'Failed to add member'));
        } finally {
            setPendingKey(null);
        }
    };
    const confirmTransfer = async () => {
        if (!transfer) return;
        setTransferError(undefined);
        const key =
            transfer.kind === 'member' ? `${workspaceId}:${transfer.userId}` : `${workspaceId}:add`;
        setPendingKey(key);
        try {
            if (transfer.kind === 'member')
                await setRole.mutateAsync({ workspaceId, userId: transfer.userId, role: 'OWNER' });
            else {
                await add.mutateAsync({ workspaceId, email: transfer.email, role: 'OWNER' });
                setEmail('');
                setNewRole('MEMBER');
            }
            notify.success('Ownership transferred');
            setTransfer(null);
        } catch (err) {
            setTransferError(getErrorMessage(err, 'Failed to transfer ownership'));
        } finally {
            setPendingKey(null);
        }
    };

    const roleOptions = (current: string): string[] =>
        (WORKSPACE_ROLES as readonly string[]).includes(current)
            ? [...WORKSPACE_ROLES]
            : [...WORKSPACE_ROLES, current];

    return (
        <>
            <Modal
                open={!transfer}
                onClose={close}
                size="xl"
                title="Members"
                description={ws?.name}
                footer={
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={close}
                        disabled={!!pendingKey}
                    >
                        Close
                    </Button>
                }
            >
                {isLoading && !ws ? (
                    <div className="space-y-3" aria-label="Loading workspace members">
                        {[0, 1].map((i) => (
                            <div key={i} className="bg-base-200 h-12 animate-pulse rounded-lg" />
                        ))}
                    </div>
                ) : isError ? (
                    <div className="border-error/30 bg-error/10 text-error rounded-lg border p-4 text-sm">
                        <p>{getErrorMessage(error, 'Failed to load workspace members.')}</p>
                        <Button
                            type="button"
                            variant="secondary"
                            className="mt-3"
                            onClick={() => void refetch()}
                        >
                            Try again
                        </Button>
                    </div>
                ) : !ws ? (
                    <p className="text-base-content/60 text-sm">
                        Workspace details are unavailable.
                    </p>
                ) : (
                    <div className="space-y-4">
                        {ws.members.length === 0 ? (
                            <p className="text-base-content/60 text-sm">
                                This workspace has no members.
                            </p>
                        ) : (
                            <div className="border-base-300 overflow-x-auto rounded-xl border">
                                <table className="w-full border-collapse text-left text-sm">
                                    <thead>
                                        <tr className="border-base-200 bg-base-200/50 text-base-content/60 border-b font-medium">
                                            <th className="px-4 py-3">Member</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3">Role</th>
                                            <th className="px-4 py-3 text-right">
                                                <span className="sr-only">Actions</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-base-200 divide-y">
                                        {ws.members.map((member) => {
                                            const isOwner = member.userId === ws.owner.id;
                                            const rowPending =
                                                pendingKey === `${workspaceId}:${member.userId}`;
                                            return (
                                                <tr key={member.userId}>
                                                    <td className="px-4 py-3">
                                                        <div className="max-w-56 min-w-0">
                                                            <p
                                                                className="text-base-content truncate font-medium"
                                                                title={member.name ?? member.email}
                                                            >
                                                                {member.name ?? member.email}
                                                            </p>
                                                            <p
                                                                className="text-base-content/60 truncate text-xs"
                                                                title={member.email}
                                                            >
                                                                {member.email}
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <StatusBadge active={member.isActive} />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Select
                                                            aria-label={`Role for ${member.email}`}
                                                            className="w-32"
                                                            value={member.role}
                                                            disabled={rowPending}
                                                            onChange={(e) => {
                                                                if (isOwner) return;
                                                                void changeRole(
                                                                    member.userId,
                                                                    member.email,
                                                                    e.target.value as WorkspaceRole,
                                                                    member.role,
                                                                );
                                                            }}
                                                        >
                                                            {roleOptions(member.role).map(
                                                                (role) => (
                                                                    <option key={role} value={role}>
                                                                        {role}
                                                                    </option>
                                                                ),
                                                            )}
                                                        </Select>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        {isOwner ? (
                                                            <span
                                                                title="Transfer ownership to another member to change this"
                                                                className="text-base-content/60 text-xs"
                                                            >
                                                                Owner
                                                            </span>
                                                        ) : (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                disabled={rowPending}
                                                                onClick={() =>
                                                                    void removeMember(member.userId)
                                                                }
                                                            >
                                                                Remove
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <form
                            onSubmit={submitAdd}
                            className="border-base-200 grid gap-3 border-t pt-4 sm:grid-cols-[minmax(0,1fr)_8rem_auto] sm:items-end"
                        >
                            <div>
                                <label
                                    htmlFor="admin-add-member-email"
                                    className="text-base-content/80 mb-1 block text-sm font-medium"
                                >
                                    User email
                                </label>
                                <Input
                                    id="admin-add-member-email"
                                    autoFocus
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setEmail(value);
                                        setEmailError(
                                            value &&
                                                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
                                                ? 'Enter a valid email address.'
                                                : '',
                                        );
                                    }}
                                    required
                                    disabled={pendingKey === `${workspaceId}:add`}
                                    aria-invalid={!!emailError}
                                    className="bg-base-100"
                                />
                                {emailError && (
                                    <p className="text-error mt-1 text-xs">{emailError}</p>
                                )}
                            </div>
                            <div>
                                <label
                                    htmlFor="admin-add-member-role"
                                    className="text-base-content/80 mb-1 block text-sm font-medium"
                                >
                                    Role
                                </label>
                                <Select
                                    id="admin-add-member-role"
                                    aria-label="New member role"
                                    value={newRole}
                                    disabled={pendingKey === `${workspaceId}:add`}
                                    onChange={(e) => {
                                        const role = e.target.value as WorkspaceRole;
                                        if (role === 'OWNER') {
                                            if (
                                                !email.trim() ||
                                                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
                                            )
                                                setEmailError(
                                                    email.trim()
                                                        ? 'Enter a valid email address.'
                                                        : 'Email is required before transferring ownership.',
                                                );
                                            else
                                                setTransfer({
                                                    kind: 'add',
                                                    email,
                                                    previousRole: newRole,
                                                });
                                        } else setNewRole(role);
                                    }}
                                >
                                    {WORKSPACE_ROLES.map((role) => (
                                        <option key={role} value={role}>
                                            {role}
                                        </option>
                                    ))}
                                </Select>
                            </div>
                            <Button type="submit" loading={pendingKey === `${workspaceId}:add`}>
                                Add
                            </Button>
                        </form>
                    </div>
                )}
            </Modal>
            <ConfirmDialog
                isOpen={!!transfer}
                title="Transfer ownership"
                description={`Make ${transfer?.email} the owner of “${ws?.name}”? The current owner will become ADMIN.`}
                confirmText="Transfer ownership"
                variant="primary"
                loading={!!pendingKey}
                error={transferError}
                onConfirm={confirmTransfer}
                onClose={() => {
                    if (!pendingKey) {
                        setTransfer(null);
                        setTransferError(undefined);
                        if (transfer?.kind === 'add') setNewRole(transfer.previousRole);
                    }
                }}
            />
        </>
    );
}
