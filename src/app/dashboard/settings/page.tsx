'use client';

import { useState } from 'react';
import {
  useWorkspace,
  useUpdateWorkspace,
  useDeleteWorkspace,
  useWorkspaceAccess,
  useAddWorkspaceMember,
  useUpdateWorkspaceMember,
  useRemoveWorkspaceMember,
} from '@/features/workspaces';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { usePermission } from '@/features/workspaces';
import { RolesPermissionsSection } from '@/features/workspaces';
import { notify, getErrorMessage } from '@/lib/toast';

// The key remounts the content when the active workspace changes,
// so local form state (like the name input) always starts fresh.
export default function SettingsPage() {
  const { active } = useWorkspace();
  return <SettingsContent key={active.workspaceId} />;
}

function SettingsContent() {
  const { active: workspace, workspaces } = useWorkspace();
  const [name, setName] = useState(workspace.name);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('VIEWER');

  const canViewMembers = usePermission('members.view');
  const canRename = usePermission('workspace.rename');
  const canAddMembers = usePermission('members.add');
  const canChangeRoles = usePermission('members.changeRole');
  const canRemoveMembers = usePermission('members.remove');
  const canDeleteWorkspace = usePermission('workspace.delete');

  const { data: members, isLoading: loadingMembers } = useWorkspaceAccess(workspace.workspaceId, {
    enabled: canViewMembers,
  });

  const { mutate: updateName, isPending: updatingName } = useUpdateWorkspace();
  const { mutate: deleteWs, isPending: deletingWs } = useDeleteWorkspace();
  const { mutate: addMember, isPending: addingMember } = useAddWorkspaceMember();
  const { mutate: updateMember } = useUpdateWorkspaceMember();
  const { mutate: removeMember } = useRemoveWorkspaceMember();

  const handleUpdateName = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed && trimmed !== workspace.name) {
      updateName(
        { workspaceId: workspace.workspaceId, name: trimmed },
        {
          onSuccess: () => notify.success('Workspace renamed'),
          onError: (error) => notify.error(getErrorMessage(error, 'Failed to rename workspace')),
        }
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

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEmail.trim()) {
      addMember(
        { workspaceId: workspace.workspaceId, email: newEmail.trim(), role: newRole },
        {
          onSuccess: () => {
            setNewEmail('');
            setNewRole('VIEWER');
            notify.success('Member added');
          },
          onError: (error) => notify.error(getErrorMessage(error, 'Failed to add member')),
        }
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Workspace Settings</h1>
        <p className="text-slate-500 mt-1">Manage your workspace details and members.</p>
      </div>

      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">General</h2>
        {canRename ? (
          <form onSubmit={handleUpdateName} className="flex gap-4 max-w-md">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={updatingName}
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50"
              placeholder="Workspace Name"
            />

            <button
              type="submit"
              disabled={name.trim() === workspace.name || updatingName || !name.trim()}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updatingName ? 'Saving...' : 'Save'}
            </button>

          </form>
        ) : (
          <p className="text-sm text-slate-900">{workspace.name}</p>
        )}
      </section>

      {canViewMembers && (
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-slate-900">Members</h2>

          {canAddMembers && (
            <form onSubmit={handleAddMember} className="flex gap-4 max-w-2xl items-end">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-slate-700">Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={addingMember}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="colleague@example.com"
                  required
                />
              </div>
              <div className="w-32 space-y-1">
                <label className="text-xs font-medium text-slate-700">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  disabled={addingMember}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="MEMBER">Member</option>
                  <option value="VIEWER">Viewer</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={addingMember || !newEmail.trim()}
                className="rounded-md bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
              >
                Add
              </button>
            </form>
          )}

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {loadingMembers ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-500 animate-pulse">
                      Loading members...
                    </td>
                  </tr>
                ) : (
                  members?.map((m) => (
                    <tr key={m.userId}>
                      <td className="px-4 py-3 text-slate-900">{m.user?.email}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {m.role === 'OWNER' ? (
                          <span className="font-medium text-indigo-600">Owner</span>
                        ) : (
                          <select
                            value={m.role}
                            onChange={(e) =>
                              updateMember(
                                {
                                  workspaceId: workspace.workspaceId,
                                  userId: m.userId,
                                  role: e.target.value,
                                },
                                {
                                  onSuccess: () => notify.success('Role updated'),
                                  onError: (error) => notify.error(getErrorMessage(error, 'Failed to update role')),
                                }
                              )
                            }
                            disabled={!canChangeRoles}
                            className="rounded border-slate-300 text-sm py-1 pl-2 pr-8 focus:ring-indigo-500 focus:border-indigo-500 border-none bg-transparent"
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
                                { workspaceId: workspace.workspaceId, userId: m.userId },
                                {
                                  onSuccess: () => notify.success('Member removed'),
                                  onError: (error) => notify.error(getErrorMessage(error, 'Failed to remove member')),
                                }
                              )
                            }
                            className="text-red-600 hover:text-red-700 font-medium text-sm"
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

      {canDeleteWorkspace && workspaces.length > 1 && (
        <section className="bg-red-50 rounded-xl border border-red-100 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-red-900">Delete Workspace</h2>
            <p className="text-red-700 text-sm mt-1">
              Permanently remove this workspace and all its data. This cannot be undone.
            </p>
          </div>
          <button
            onClick={() => setDeleteOpen(true)}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Delete Workspace
          </button>
        </section>
      )}

      <RolesPermissionsSection />

      <ConfirmDialog
        isOpen={deleteOpen}
        title="Delete Workspace"
        description={`Are you sure you want to delete "${workspace.name}"? This will permanently delete all transactions, habits, and notes.`}
        confirmText={deletingWs ? 'Deleting...' : 'Delete'}
        variant="danger"
        onConfirm={handleDelete}
        onClose={() => setDeleteOpen(false)}
      />
    </div>
  );
}