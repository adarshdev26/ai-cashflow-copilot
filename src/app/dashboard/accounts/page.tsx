'use client';

import { useState, useCallback } from 'react';
import { Plus, Landmark } from 'lucide-react';
import { PrimaryButton } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useActiveWorkspaceId, usePermission } from '@/features/workspaces';
import { notify, getErrorMessage } from '@/lib/ui/toast';
import {
  useAccounts,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
  AccountCard,
  AddAccountModal,
} from '@/features/accounts';
import type { AccountWithBalance, CreateAccountInput } from '@/features/accounts';

type FormState = { mode: 'create' } | { mode: 'edit'; account: AccountWithBalance } | null;

export default function AccountsPage() {
  const workspaceId = useActiveWorkspaceId();
  const canCreate = usePermission('account.create');
  const canUpdate = usePermission('account.update');
  const canDeactivate = usePermission('account.deactivate');

  const { data: accounts, isLoading, error, refetch } = useAccounts(workspaceId);
  const { mutate: createAcc, isPending: isCreating } = useCreateAccount(workspaceId);
  const { mutate: updateAcc, isPending: isUpdating } = useUpdateAccount(workspaceId);
  const { mutate: deleteAcc, isPending: isDeleting } = useDeleteAccount(workspaceId);

  const [formState, setFormState] = useState<FormState>(null);
  const [formError, setFormError] = useState<string | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<AccountWithBalance | null>(null);

  const closeForm = useCallback(() => {
    setFormState(null);
    setFormError(undefined);
  }, []);

  const handleSubmit = useCallback(
    (values: CreateAccountInput) => {
      setFormError(undefined);
      if (formState?.mode === 'edit') {
        updateAcc(
          { id: formState.account.id, data: values },
          {
            onSuccess: () => {
              closeForm();
              notify.success('Account updated');
            },
            onError: (err) => setFormError(getErrorMessage(err, 'Failed to update account')),
          }
        );
      } else {
        createAcc(values, {
          onSuccess: () => {
            closeForm();
            notify.success('Account created');
          },
          onError: (err) => setFormError(getErrorMessage(err, 'Failed to create account')),
        });
      }
    },
    [formState, updateAcc, createAcc, closeForm]
  );

  const handleToggleActive = useCallback(
    (account: AccountWithBalance) => {
      updateAcc(
        { id: account.id, data: { isActive: !account.isActive } },
        {
          onSuccess: () => notify.success(account.isActive ? 'Account deactivated' : 'Account reactivated'),
          onError: (err) => notify.error(getErrorMessage(err, 'Failed to update account')),
        }
      );
    },
    [updateAcc]
  );

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteAcc(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        notify.success('Account deleted');
      },
      onError: (err) => {
        setDeleteTarget(null);
        notify.error(getErrorMessage(err, 'Failed to delete account'));
      },
    });
  }, [deleteTarget, deleteAcc]);

  const busy = isUpdating || isDeleting;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-base-content">Accounts</h1>
          <p className="text-sm text-base-content/60">Bank accounts, cards, cash and wallets for this workspace.</p>
        </div>
        {canCreate && (
          <PrimaryButton data-tour="accounts-add-btn" onClick={() => setFormState({ mode: 'create' })} leftIcon={<Plus className="h-4 w-4" />}>
            Add Account
          </PrimaryButton>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-tour="accounts-list">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-4 rounded-xl border border-base-300 bg-base-100 p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded-lg bg-base-200" />
                <div className="space-y-2">
                  <div className="h-3 w-28 animate-pulse rounded bg-base-200" />
                  <div className="h-3 w-16 animate-pulse rounded bg-base-200" />
                </div>
              </div>
              <div className="h-7 w-32 animate-pulse rounded bg-base-200" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-error/30 bg-error/10 p-6 text-center">
          <p className="text-sm text-error">{getErrorMessage(error, 'Failed to load accounts.')}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 rounded-md border border-error/30 px-3 py-1.5 text-xs font-medium text-error hover:bg-error/10"
          >
            Try again
          </button>
        </div>
      ) : !accounts || accounts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-base-300 bg-base-100 p-10 text-center">
          <Landmark className="mx-auto h-8 w-8 text-base-content/40" />
          <p className="mt-3 text-sm font-medium text-base-content">No accounts yet</p>
          <p className="mt-1 text-sm text-base-content/60">Add an account to start tracking where your money lives.</p>
          {canCreate && (
            <div className="mt-4 flex justify-center">
              <PrimaryButton onClick={() => setFormState({ mode: 'create' })} leftIcon={<Plus className="h-4 w-4" />}>
                Add Account
              </PrimaryButton>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              canEdit={canUpdate}
              canManage={canDeactivate}
              busy={busy}
              onEdit={(a) => setFormState({ mode: 'edit', account: a })}
              onToggleActive={handleToggleActive}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {formState && (formState.mode === 'create' ? canCreate : canUpdate) && (
        <AddAccountModal
          key={formState.mode === 'edit' ? formState.account.id : 'new'}
          open={true}
          onClose={closeForm}
          onSubmit={handleSubmit}
          isSubmitting={isCreating || isUpdating}
          error={formError}
          account={formState.mode === 'edit' ? formState.account : null}
        />
      )}

      {deleteTarget && canDeactivate && (
        <ConfirmDialog
          isOpen={true}
          title="Delete account"
          description={`Delete "${deleteTarget.name}"? This can't be undone. Accounts that have transactions can only be deactivated.`}
          confirmText="Delete"
          variant="danger"
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={isDeleting}
        />
      )}
    </div>
  );
}
