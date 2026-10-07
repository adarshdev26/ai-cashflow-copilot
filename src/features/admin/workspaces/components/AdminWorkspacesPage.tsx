'use client';

import { useCallback, useState } from 'react';
import { FilterSelect } from '@/components/ui/FilterSelect';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { notify, getErrorMessage } from '@/lib/ui/toast';
import { useAdminTableState } from '../../shared/hooks/use-admin-table-state';
import { useAdminWorkspaces, useAdminWorkspaceMutations } from '../hooks/use-admin-workspaces';
import type { AdminWorkspaceFilters, AdminWorkspaceRow, AdminWorkspaceSortField } from '../types';
import { WorkspacesTable } from './WorkspacesTable';
import { WorkspaceFormModal } from './modals/WorkspaceFormModal';
import { WorkspaceMembersModal } from './modals/WorkspaceMembersModal';

type Dialog =
    | { kind: 'edit'; workspace: AdminWorkspaceRow }
    | { kind: 'members'; workspace: AdminWorkspaceRow }
    | { kind: 'confirm'; action: 'deactivate' | 'delete'; workspace: AdminWorkspaceRow };

export function AdminWorkspacesPage() {
    const table = useAdminTableState<AdminWorkspaceFilters, AdminWorkspaceSortField>({
        defaultFilters: { search: undefined, isActive: undefined },
        defaultSortBy: 'createdAt',
        defaultSortDir: 'desc',
    });
    const { data, isLoading, isFetching, isError, error, refetch } = useAdminWorkspaces(
        table.list.params,
    );
    const mutations = useAdminWorkspaceMutations();
    const [dialog, setDialog] = useState<Dialog | null>(null);
    const [confirmError, setConfirmError] = useState<string | undefined>();

    const edit = useCallback(
        (workspace: AdminWorkspaceRow) => setDialog({ kind: 'edit', workspace }),
        [],
    );
    const members = useCallback(
        (workspace: AdminWorkspaceRow) => setDialog({ kind: 'members', workspace }),
        [],
    );
    const remove = useCallback((workspace: AdminWorkspaceRow) => {
        setConfirmError(undefined);
        setDialog({ kind: 'confirm', action: 'delete', workspace });
    }, []);
    const toggleStatus = useCallback(
        async (workspace: AdminWorkspaceRow) => {
            if (workspace.isActive) {
                setConfirmError(undefined);
                setDialog({ kind: 'confirm', action: 'deactivate', workspace });
                return;
            }
            try {
                await mutations.setStatus.mutateAsync({ id: workspace.id, isActive: true });
                notify.success('Workspace activated');
            } catch (err) {
                notify.error(getErrorMessage(err, 'Failed to activate'));
            }
        },
        [mutations.setStatus],
    );
    const confirm = useCallback(async () => {
        if (dialog?.kind !== 'confirm') return;
        setConfirmError(undefined);
        try {
            if (dialog.action === 'delete') await mutations.remove.mutateAsync(dialog.workspace.id);
            else
                await mutations.setStatus.mutateAsync({ id: dialog.workspace.id, isActive: false });
            notify.success(
                dialog.action === 'delete' ? 'Workspace deleted' : 'Workspace deactivated',
            );
            setDialog(null);
        } catch (err) {
            setConfirmError(getErrorMessage(err, 'Action failed'));
        }
    }, [dialog, mutations.remove, mutations.setStatus]);

    const filtersActive = !!table.globalFilter || !!table.list.filters.isActive;
    const empty = !isLoading && !isError && data?.pagination.totalCount === 0 && !filtersActive;
    const closeDialog = useCallback(() => {
        if (!mutations.remove.isPending && !mutations.setStatus.isPending) setDialog(null);
    }, [mutations.remove.isPending, mutations.setStatus.isPending]);

    return (
        <div className="mx-auto max-w-7xl space-y-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-base-content text-2xl font-bold tracking-tight">
                        Workspaces
                    </h1>
                    <p className="text-base-content/60 text-sm">
                        Manage workspaces, members, and ownership.
                    </p>
                </div>
            </div>
            {isError && !data ? (
                <div className="border-error/30 bg-error/10 rounded-xl border p-6 text-center">
                    <p className="text-error text-sm">
                        {getErrorMessage(error, 'Failed to load workspaces.')}
                    </p>
                    <Button variant="secondary" className="mt-3" onClick={() => void refetch()}>
                        Try again
                    </Button>
                </div>
            ) : empty ? (
                <div className="border-base-300 bg-base-100 rounded-xl border border-dashed p-10 text-center">
                    <p className="text-base-content text-sm font-medium">No workspaces yet.</p>
                    <p className="text-base-content/60 mt-1 text-sm">
                        Workspaces appear here when users create them.
                    </p>
                </div>
            ) : (
                <WorkspacesTable
                    data={data?.data ?? []}
                    onEdit={edit}
                    onMembers={members}
                    onToggleStatus={toggleStatus}
                    onDelete={remove}
                    pagination={table.paginationState}
                    sorting={table.sortingState}
                    globalFilter={table.globalFilter}
                    onPaginationChange={table.onPaginationChange}
                    onSortingChange={table.onSortingChange}
                    onGlobalFilterChange={table.onGlobalFilterChange}
                    pageCount={data?.pagination.totalPages ?? 1}
                    totalCount={data?.pagination.totalCount ?? 0}
                    isLoading={isLoading}
                    isFetching={isFetching}
                    filters={
                        <FilterSelect
                            aria-label="Filter workspaces by status"
                            value={table.list.filters.isActive ?? ''}
                            onChange={(e) =>
                                table.list.setFilter(
                                    'isActive',
                                    (e.target.value || undefined) as AdminWorkspaceFilters['isActive'],
                                )
                            }
                        >
                            <option value="">All statuses</option>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </FilterSelect>
                    }
                    activeFilterCount={table.activeFilterCount}
                    onClearFilters={table.clearFilters}
                />
            )}

            {dialog?.kind === 'edit' && (
                <WorkspaceFormModal
                    key={dialog.workspace.id}
                    workspace={dialog.workspace}
                    onClose={closeDialog}
                />
            )}
            {dialog?.kind === 'members' && (
                <WorkspaceMembersModal
                    key={dialog.workspace.id}
                    workspaceId={dialog.workspace.id}
                    onClose={closeDialog}
                />
            )}
            {dialog?.kind === 'confirm' && (
                <ConfirmDialog
                    isOpen
                    title={dialog.action === 'delete' ? 'Delete workspace' : 'Deactivate workspace'}
                    description={
                        dialog.action === 'delete'
                            ? `Permanently delete "${dialog.workspace.name}" and all its transactions, accounts, budgets and categories? This cannot be undone.`
                            : `Members of "${dialog.workspace.name}" will lose access until it is reactivated. Data is kept.`
                    }
                    confirmText={dialog.action === 'delete' ? 'Delete' : 'Deactivate'}
                    variant="danger"
                    loading={mutations.remove.isPending || mutations.setStatus.isPending}
                    error={confirmError}
                    onConfirm={confirm}
                    onClose={closeDialog}
                />
            )}
        </div>
    );
}
