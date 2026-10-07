'use client';

import { useState } from 'react';
import {
    useWorkspace,
    useUpdateWorkspace,
    useDeleteWorkspace,
    useWorkspaceAccess,
    useUpdateWorkspaceMember,
    useRemoveWorkspaceMember,
    usePermission,
    RolesPermissionsSection,
} from '@/features/workspaces';
import {
    InvitationLinkCard,
    InviteMemberForm,
    PendingInvitationsList,
    type IssuedInvitationLink,
} from '@/features/invitations';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { notify, getErrorMessage } from '@/lib/ui/toast';
import { WorkspaceFinanceSettings } from './WorkspaceFinanceSettings';
import { usePublicSettings } from '@/features/settings/hooks/use-settings';

// The key remounts the content when the active workspace changes,
// so local form state (like the name input) always starts fresh.
export function WorkspaceTab() {
    const { active } = useWorkspace();
    return <WorkspaceContent key={active.workspaceId} />;
}

function WorkspaceContent() {
    const { active: workspace, workspaces } = useWorkspace();
    const { data: publicSettings } = usePublicSettings();
    const [name, setName] = useState(workspace.name);
    const [deleteOpen, setDeleteOpen] = useState(false);

    // The newest invite link. Memory only: the raw token is never stored anywhere.
    const [issuedLink, setIssuedLink] = useState<IssuedInvitationLink | null>(null);

    const canViewMembers = usePermission('members.view');
    const canRename = usePermission('workspace.rename');
    const canInvite = usePermission('members.invite');
    const canChangeRoles = usePermission('members.changeRole');
    const canRemoveMembers = usePermission('members.remove');
    const canDeleteWorkspace = usePermission('workspace.delete');
    const minNameLength = Number(publicSettings?.['limits.workspaceNameMinLength'] ?? 2);
    const maxNameLength = Number(publicSettings?.['limits.workspaceNameMaxLength'] ?? 60);
    const invitationsEnabled = publicSettings?.['features.invitationsEnabled'] !== false;

    const { data: members, isLoading: loadingMembers } = useWorkspaceAccess(workspace.workspaceId, {
        enabled: canViewMembers,
    });

    const { mutate: updateName, isPending: updatingName } = useUpdateWorkspace();
    const { mutate: deleteWs, isPending: deletingWs } = useDeleteWorkspace();
    const { mutate: updateMember } = useUpdateWorkspaceMember();
    const { mutate: removeMember } = useRemoveWorkspaceMember();

    const handleUpdateName = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (
            trimmed.length >= minNameLength &&
            trimmed.length <= maxNameLength &&
            trimmed !== workspace.name
        ) {
            updateName(
                { workspaceId: workspace.workspaceId, name: trimmed },
                {
                    onSuccess: () => notify.success('Workspace renamed'),
                    onError: (error) =>
                        notify.error(getErrorMessage(error, 'Failed to rename workspace')),
                },
            );
        }
    };

    const handleDelete = () => {
        deleteWs(workspace.workspaceId, {
            onSuccess: () => {
                setDeleteOpen(false);
                notify.success('Workspace deleted');
            },
            onError: (error) => notify.error(getErrorMessage(error, 'Failed to delete workspace')),
        });
    };

    return (
        <div className="space-y-8">
            <section
                className="bg-base-100 border-base-300 space-y-4 rounded-xl border p-6 shadow-sm"
                data-tour="settings-workspace-general"
            >
                <h2 className="text-base-content text-lg font-semibold">General</h2>
                {canRename ? (
                    <form
                        onSubmit={handleUpdateName}
                        className="flex max-w-md gap-4"
                        data-tour="settings-workspace-rename"
                    >
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            minLength={minNameLength}
                            maxLength={maxNameLength}
                            disabled={updatingName}
                            className="border-base-300 bg-base-100 text-base-content focus:border-primary focus:ring-primary disabled:bg-base-200 flex-1 rounded-md border px-3 py-2 text-base focus:ring-1 focus:outline-none sm:text-sm"
                            placeholder="Workspace Name"
                        />

                        <button
                            type="submit"
                            disabled={
                                name.trim() === workspace.name ||
                                updatingName ||
                                name.trim().length < minNameLength ||
                                name.trim().length > maxNameLength
                            }
                            className="bg-primary text-primary-content rounded-md px-4 py-2 text-sm font-medium hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {updatingName ? 'Saving...' : 'Save'}
                        </button>
                    </form>
                ) : (
                    <p className="text-base-content text-sm">{workspace.name}</p>
                )}
            </section>

            <WorkspaceFinanceSettings workspaceId={workspace.workspaceId} canEdit={canRename} />

            {canViewMembers && (
                <section
                    className="bg-base-100 border-base-300 space-y-6 rounded-xl border p-6 shadow-sm"
                    data-tour="settings-members"
                >
                    <h2 className="text-base-content text-lg font-semibold">Members</h2>

                    {canInvite && invitationsEnabled && (
                        <InviteMemberForm
                            workspaceId={workspace.workspaceId}
                            onCreated={setIssuedLink}
                        />
                    )}

                    <div className="border-base-300 overflow-x-auto rounded-lg border">
                        <table className="divide-base-300 min-w-full divide-y text-left text-sm">
                            <thead className="bg-base-200 text-base-content/60">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Email</th>
                                    <th className="px-4 py-3 font-medium">Role</th>
                                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-base-300 bg-base-100 divide-y">
                                {loadingMembers ? (
                                    <tr>
                                        <td
                                            colSpan={3}
                                            className="text-base-content/60 animate-pulse px-4 py-8 text-center"
                                        >
                                            Loading members...
                                        </td>
                                    </tr>
                                ) : (
                                    members?.map((m) => (
                                        <tr key={m.userId}>
                                            <td className="text-base-content px-4 py-3">
                                                {m.user?.email}
                                            </td>
                                            <td className="text-base-content/80 px-4 py-3">
                                                {m.role === 'OWNER' ? (
                                                    <span className="text-primary font-medium">
                                                        Owner
                                                    </span>
                                                ) : (
                                                    <select
                                                        value={m.role}
                                                        onChange={(e) =>
                                                            updateMember(
                                                                {
                                                                    workspaceId:
                                                                        workspace.workspaceId,
                                                                    userId: m.userId,
                                                                    role: e.target.value,
                                                                },
                                                                {
                                                                    onSuccess: () =>
                                                                        notify.success(
                                                                            'Role updated',
                                                                        ),
                                                                    onError: (error) =>
                                                                        notify.error(
                                                                            getErrorMessage(
                                                                                error,
                                                                                'Failed to update role',
                                                                            ),
                                                                        ),
                                                                },
                                                            )
                                                        }
                                                        disabled={!canChangeRoles}
                                                        className="text-base-content focus:ring-primary focus:border-primary rounded border-none bg-transparent py-1 pr-8 pl-2 text-base sm:text-sm"
                                                    >
                                                        <option value="ADMIN">Admin</option>
                                                        <option value="MEMBER">Member</option>
                                                        <option value="VIEWER">Viewer</option>
                                                    </select>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {m.role !== 'OWNER' && canRemoveMembers && (
                                                    <button
                                                        onClick={() =>
                                                            removeMember(
                                                                {
                                                                    workspaceId:
                                                                        workspace.workspaceId,
                                                                    userId: m.userId,
                                                                },
                                                                {
                                                                    onSuccess: () =>
                                                                        notify.success(
                                                                            'Member removed',
                                                                        ),
                                                                    onError: (error) =>
                                                                        notify.error(
                                                                            getErrorMessage(
                                                                                error,
                                                                                'Failed to remove member',
                                                                            ),
                                                                        ),
                                                                },
                                                            )
                                                        }
                                                        className="text-error text-sm font-medium hover:underline"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {canInvite && (
                <section
                    className="bg-base-100 border-base-300 space-y-4 rounded-xl border p-6 shadow-sm"
                    data-tour="settings-invitations"
                >
                    <div>
                        <h2 className="text-base-content text-lg font-semibold">
                            Pending Invitations
                        </h2>
                        <p className="text-base-content/60 mt-1 text-sm">
                            Invitations that have been sent but not yet accepted.
                        </p>
                    </div>
                    <PendingInvitationsList
                        workspaceId={workspace.workspaceId}
                        allowResend={invitationsEnabled}
                        onLinkReady={setIssuedLink}
                        onCancelled={(email) =>
                            setIssuedLink((current) => (current?.email === email ? null : current))
                        }
                    />
                </section>
            )}

            {canDeleteWorkspace && workspaces.length > 1 && (
                <section className="bg-error/10 border-error/30 flex items-center justify-between gap-4 rounded-xl border p-6">
                    <div>
                        <h2 className="text-error text-lg font-semibold">Delete Workspace</h2>
                        <p className="text-error mt-1 text-sm">
                            Permanently remove this workspace and all its data. This cannot be
                            undone.
                        </p>
                    </div>
                    <button
                        onClick={() => setDeleteOpen(true)}
                        className="bg-error text-error-content shrink-0 rounded-md px-4 py-2 text-sm font-medium hover:opacity-90"
                    >
                        Delete Workspace
                    </button>
                </section>
            )}

            <RolesPermissionsSection />

            <ConfirmDialog
                isOpen={deleteOpen}
                title="Delete Workspace"
                description={`Are you sure you want to delete "${workspace.name}"? This will permanently delete all transactions.`}
                confirmText={deletingWs ? 'Deleting...' : 'Delete'}
                variant="danger"
                onConfirm={handleDelete}
                onClose={() => setDeleteOpen(false)}
            />
            <InvitationLinkCard link={issuedLink} onDismiss={() => setIssuedLink(null)} />
        </div>
    );
}
