'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import { WORKSPACE_ROLES, type WorkspaceRole } from '../../../shared/types';
import { notify, getErrorMessage } from '@/lib/ui/toast';
import { useAdminMemberMutations } from '../../../workspaces';
import { useAdminUser } from '../../hooks/use-admin-users';

export function UserAccessModal({ userId, onClose }: { userId: string; onClose: () => void }) {
    const { data, isLoading, isError, error, refetch } = useAdminUser(userId);
    const { setRole, remove } = useAdminMemberMutations();
    const [pendingKey, setPendingKey] = useState<string | null>(null);
    const [transfer, setTransfer] = useState<{
        workspaceId: string;
        workspaceName: string;
        ownerEmail: string;
    } | null>(null);
    const [transferError, setTransferError] = useState<string | undefined>();
    const user = data?.user;
    const close = () => {
        if (!pendingKey) onClose();
    };

    const changeRole = async (workspaceId: string, workspaceName: string, role: WorkspaceRole) => {
        console.log('[UserAccessModal] changeRole', { workspaceId, role });
        if (role === 'OWNER') {
            setTransferError(undefined);
            setTransfer({ workspaceId, workspaceName, ownerEmail: user?.email ?? '' });
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
    const removeAccess = async (workspaceId: string) => {
        console.log('[UserAccessModal] removeAccess', { workspaceId, userId });
        const key = `${workspaceId}:${userId}`;
        setPendingKey(key);
        try {
            await remove.mutateAsync({ workspaceId, userId });
            notify.success('Access removed');
        } catch (err) {
            notify.error(getErrorMessage(err, 'Failed to remove access'));
        } finally {
            setPendingKey(null);
        }
    };
    const confirmTransfer = async () => {
        if (!transfer) return;
        const key = `${transfer.workspaceId}:${userId}`;
        setPendingKey(key);
        setTransferError(undefined);
        try {
            await setRole.mutateAsync({ workspaceId: transfer.workspaceId, userId, role: 'OWNER' });
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
                title="Workspace access"
                description={user?.email}
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
                {isLoading && !user ? (
                    <div className="space-y-3" aria-label="Loading workspace access">
                        {[0, 1].map((i) => (
                            <div key={i} className="bg-base-200 h-12 animate-pulse rounded-lg" />
                        ))}
                    </div>
                ) : isError ? (
                    <div className="border-error/30 bg-error/10 text-error rounded-lg border p-4 text-sm">
                        <p>{getErrorMessage(error, 'Failed to load workspace access.')}</p>
                        <Button
                            type="button"
                            variant="secondary"
                            className="mt-3"
                            onClick={() => void refetch()}
                        >
                            Try again
                        </Button>
                    </div>
                ) : !user ? (
                    <p className="text-base-content/60 text-sm">User details are unavailable.</p>
                ) : user.workspaces.length === 0 ? (
                    <p className="text-base-content/60 text-sm">
                        This user has no workspace access.
                    </p>
                ) : (
                    <div className="border-base-300 overflow-x-auto rounded-xl border">
                        <table className="w-full border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-base-200 bg-base-200/50 text-base-content/60 border-b font-medium">
                                    <th className="px-4 py-3">Workspace</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Role</th>
                                    <th className="px-4 py-3 text-right">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-base-200 divide-y">
                                {user.workspaces.map((workspace) => {
                                    const rowPending =
                                        pendingKey === `${workspace.workspaceId}:${userId}`;
                                    return (
                                        <tr key={workspace.workspaceId}>
                                            <td className="px-4 py-3">
                                                <div className="max-w-56 min-w-0">
                                                    <p
                                                        className="text-base-content truncate font-medium"
                                                        title={workspace.name}
                                                    >
                                                        {workspace.name}
                                                    </p>
                                                    {workspace.isOwner && (
                                                        <span
                                                            title="Transfer ownership to another member to change this"
                                                            className="text-base-content/60 text-xs"
                                                        >
                                                            Owner
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <StatusBadge active={workspace.isActive} />
                                            </td>
                                            <td className="px-4 py-3">
                                                <Select
                                                    aria-label={`Role in ${workspace.name}`}
                                                    className="w-32"
                                                    value={workspace.role}
                                                    disabled={rowPending}
                                                    onChange={(e) => {
                                                        if (workspace.isOwner) return;
                                                        void changeRole(
                                                            workspace.workspaceId,
                                                            workspace.name,
                                                            e.target.value as WorkspaceRole,
                                                        );
                                                    }}
                                                >
                                                    {roleOptions(workspace.role).map((role) => (
                                                        <option key={role} value={role}>
                                                            {role}
                                                        </option>
                                                    ))}
                                                </Select>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={workspace.isOwner || rowPending}
                                                    onClick={() =>
                                                        void removeAccess(workspace.workspaceId)
                                                    }
                                                >
                                                    Remove
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Modal>
            <ConfirmDialog
                isOpen={!!transfer}
                title="Transfer ownership"
                description={`Make ${transfer?.ownerEmail} the owner of “${transfer?.workspaceName}”? The current owner will become ADMIN.`}
                confirmText="Transfer ownership"
                variant="primary"
                loading={!!pendingKey}
                error={transferError}
                onConfirm={confirmTransfer}
                onClose={() => {
                    if (!pendingKey) {
                        setTransfer(null);
                        setTransferError(undefined);
                    }
                }}
            />
        </>
    );
}
