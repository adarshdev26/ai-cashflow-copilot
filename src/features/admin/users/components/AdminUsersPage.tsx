'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageTransitionOverlay } from '@/components/ui/PageTransitionOverlay';
import { Select } from '@/components/ui/Select';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { notify, getErrorMessage } from '@/lib/ui/toast';
import { useAdminTableState } from '../../shared/hooks/use-admin-table-state';
import { useAdminUsers, useAdminUserMutations } from '../hooks/use-admin-users';
import type { AdminUserFilters, AdminUserRow, AdminUserSortField } from '../types';
import { UsersTable } from './UsersTable';
import { UserFormModal } from './modals/UserFormModal';
import { UserAccessModal } from './modals/UserAccessModal';
import { ResetPasswordModal } from './modals/ResetPasswordModal';

type Dialog =
    | { kind: 'form'; user: AdminUserRow | null }
    | { kind: 'access'; user: AdminUserRow }
    | { kind: 'password'; user: AdminUserRow }
    | { kind: 'confirm'; action: 'deactivate' | 'delete'; user: AdminUserRow };

export function AdminUsersPage() {
    const router = useRouter();
    const table = useAdminTableState<AdminUserFilters, AdminUserSortField>({
        defaultFilters: { search: undefined, isActive: undefined },
        defaultSortBy: 'createdAt',
        defaultSortDir: 'desc',
    });
    const { data, isLoading, isFetching, isError, error, refetch } = useAdminUsers(
        table.list.params,
    );
    const mutations = useAdminUserMutations();
    const [dialog, setDialog] = useState<Dialog | null>(null);
    const [confirmError, setConfirmError] = useState<string | undefined>();
    const [openingAccount, setOpeningAccount] = useState<string | null>(null);

    const edit = useCallback((user: AdminUserRow) => setDialog({ kind: 'form', user }), []);
    const access = useCallback((user: AdminUserRow) => setDialog({ kind: 'access', user }), []);
    const openAccount = useCallback(
        async (user: AdminUserRow) => {
            setOpeningAccount(user.email);
            try {
                await mutations.impersonate.mutateAsync(user.id, {
                    onSuccess: () => router.prefetch('/dashboard'),
                });
                router.push('/dashboard');
            } catch (err) {
                setOpeningAccount(null);
                notify.error(getErrorMessage(err, 'Failed to open account'));
            }
        },
        [mutations.impersonate, router],
    );
    const password = useCallback((user: AdminUserRow) => setDialog({ kind: 'password', user }), []);
    const remove = useCallback((user: AdminUserRow) => {
        setConfirmError(undefined);
        setDialog({ kind: 'confirm', action: 'delete', user });
    }, []);
    const toggleStatus = useCallback(
        async (user: AdminUserRow) => {
            if (user.isActive) {
                setConfirmError(undefined);
                setDialog({ kind: 'confirm', action: 'deactivate', user });
                return;
            }
            try {
                await mutations.setStatus.mutateAsync({ id: user.id, isActive: true });
                notify.success('User activated');
            } catch (err) {
                notify.error(getErrorMessage(err, 'Failed to update status'));
            }
        },
        [mutations.setStatus],
    );

    const confirm = useCallback(async () => {
        if (dialog?.kind !== 'confirm') return;
        setConfirmError(undefined);
        try {
            if (dialog.action === 'delete') await mutations.remove.mutateAsync(dialog.user.id);
            else await mutations.setStatus.mutateAsync({ id: dialog.user.id, isActive: false });
            notify.success(dialog.action === 'delete' ? 'User deleted' : 'User deactivated');
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
                    <h1 className="text-base-content text-2xl font-bold tracking-tight">Users</h1>
                    <p className="text-base-content/60 text-sm">
                        Manage all users and their workspace access.
                    </p>
                </div>
                <Button
                    leftIcon={<Plus className="h-4 w-4" />}
                    onClick={() => setDialog({ kind: 'form', user: null })}
                >
                    Add user
                </Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <Select
                    aria-label="Filter users by status"
                    className="w-40"
                    value={table.list.filters.isActive ?? ''}
                    onChange={(e) =>
                        table.list.setFilter(
                            'isActive',
                            (e.target.value || undefined) as AdminUserFilters['isActive'],
                        )
                    }
                >
                    <option value="">All statuses</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                </Select>
            </div>
            {isError && !data ? (
                <div className="border-error/30 bg-error/10 rounded-xl border p-6 text-center">
                    <p className="text-error text-sm">
                        {getErrorMessage(error, 'Failed to load users.')}
                    </p>
                    <Button variant="secondary" className="mt-3" onClick={() => void refetch()}>
                        Try again
                    </Button>
                </div>
            ) : empty ? (
                <div className="border-base-300 bg-base-100 rounded-xl border border-dashed p-10 text-center">
                    <p className="text-base-content text-sm font-medium">No users yet.</p>
                    <p className="text-base-content/60 mt-1 text-sm">
                        Add a user to manage their account and workspace access.
                    </p>
                </div>
            ) : (
                <UsersTable
                    data={data?.data ?? []}
                    onEdit={edit}
                    onAccess={access}
                    onOpenAccount={openAccount}
                    onPassword={password}
                    onToggleStatus={toggleStatus}
                    onDelete={remove}
                    actionsDisabled={openingAccount !== null}
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
                />
            )}

            <PageTransitionOverlay
                isVisible={openingAccount !== null}
                message={`Opening ${openingAccount ?? ''}'s account…`}
            />

            {dialog?.kind === 'form' && (
                <UserFormModal
                    key={dialog.user?.id ?? 'new'}
                    user={dialog.user}
                    onClose={closeDialog}
                />
            )}
            {dialog?.kind === 'access' && (
                <UserAccessModal
                    key={dialog.user.id}
                    userId={dialog.user.id}
                    onClose={closeDialog}
                />
            )}
            {dialog?.kind === 'password' && (
                <ResetPasswordModal key={dialog.user.id} user={dialog.user} onClose={closeDialog} />
            )}
            {dialog?.kind === 'confirm' && (
                <ConfirmDialog
                    isOpen
                    title={dialog.action === 'delete' ? 'Delete user' : 'Deactivate user'}
                    description={
                        dialog.action === 'delete'
                            ? `Permanently delete ${dialog.user.email}? This cannot be undone.`
                            : `${dialog.user.email} will be signed out and unable to log in.`
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
