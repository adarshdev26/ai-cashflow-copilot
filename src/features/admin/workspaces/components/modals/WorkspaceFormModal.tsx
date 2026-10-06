'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { notify, getErrorMessage } from '@/lib/ui/toast';
import { useAdminWorkspaceMutations } from '../../hooks/use-admin-workspaces';
import { usePublicSettings } from '@/features/settings/hooks/use-settings';
import type { AdminWorkspaceRow } from '../../types';

export function WorkspaceFormModal({
    workspace,
    onClose,
}: {
    workspace: AdminWorkspaceRow;
    onClose: () => void;
}) {
    const { update } = useAdminWorkspaceMutations();
    const { data: publicSettings } = usePublicSettings();
    const [name, setName] = useState(workspace.name);
    const [currency, setCurrency] = useState(workspace.currency);
    const [submitted, setSubmitted] = useState(false);
    const pending = update.isPending;
    const minNameLength = Number(publicSettings?.['limits.workspaceNameMinLength'] ?? 2);
    const maxNameLength = Number(publicSettings?.['limits.workspaceNameMaxLength'] ?? 60);
    const nameError =
        name.trim().length < minNameLength || name.trim().length > maxNameLength
            ? `Name must be ${minNameLength}-${maxNameLength} characters.`
            : '';
    const currencyError = !/^[A-Z]{3}$/.test(currency.trim().toUpperCase())
        ? 'Enter a 3-letter currency code.'
        : '';
    const close = () => {
        if (!pending) onClose();
    };
    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        if (nameError || currencyError) return;
        try {
            await update.mutateAsync({
                id: workspace.id,
                name: name.trim(),
                currency: currency.trim().toUpperCase(),
            });
            notify.success('Workspace updated');
            onClose();
        } catch (err) {
            notify.error(getErrorMessage(err, 'Failed to update workspace'));
        }
    };
    return (
        <Modal
            open
            onClose={close}
            closeOnBackdrop={!pending}
            title="Edit workspace"
            footer={
                <>
                    <Button variant="secondary" onClick={close} disabled={pending}>
                        Cancel
                    </Button>
                    <Button type="submit" form="admin-workspace-form" loading={pending}>
                        Save
                    </Button>
                </>
            }
        >
            <form id="admin-workspace-form" onSubmit={submit} noValidate className="space-y-3">
                <div>
                    <label
                        htmlFor="admin-workspace-name"
                        className="text-base-content/80 mb-1 block text-sm font-medium"
                    >
                        Name
                    </label>
                    <Input
                        id="admin-workspace-name"
                        autoFocus
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        minLength={minNameLength}
                        maxLength={maxNameLength}
                        disabled={pending}
                        aria-invalid={!!nameError}
                        className="bg-base-100"
                    />
                    {submitted && nameError && (
                        <p className="text-error mt-1 text-xs">{nameError}</p>
                    )}
                </div>
                <div>
                    <label
                        htmlFor="admin-workspace-currency"
                        className="text-base-content/80 mb-1 block text-sm font-medium"
                    >
                        Currency
                    </label>
                    <Input
                        id="admin-workspace-currency"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                        maxLength={3}
                        disabled={pending}
                        aria-invalid={!!currencyError}
                        className="bg-base-100"
                    />
                    <p className="text-base-content/60 mt-1 text-xs">
                        Enter the 3-letter currency code, such as INR.
                    </p>
                    {submitted && currencyError && (
                        <p className="text-error mt-1 text-xs">{currencyError}</p>
                    )}
                </div>
            </form>
        </Modal>
    );
}
