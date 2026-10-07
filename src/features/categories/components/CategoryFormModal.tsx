'use client';
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button, PrimaryButton } from '@/components/ui/Button';
import { notify, getErrorMessage } from '@/lib/ui/toast';
import { CATEGORY_COLORS } from '../constants';
import { useCreateCategory, useUpdateCategory } from '../hooks/use-category-mutations';
import type { CategoryItem, CategoryKind } from '../types';
import { CategoryFormFields } from './CategoryFormFields';

type Props = {
    open: boolean;
    onClose: () => void;
    workspaceId: string;
    category?: CategoryItem | null; // set = edit mode
    defaultType?: CategoryKind; // preselected type for a new category
    onSaved?: (category: CategoryItem) => void; // inline add uses this to select the new category
};

export function CategoryFormModal({
    open,
    onClose,
    workspaceId,
    category,
    defaultType,
    onSaved,
}: Props) {
    const isEdit = Boolean(category);
    const [name, setName] = useState(category?.name ?? '');
    const [color, setColor] = useState(category?.color ?? CATEGORY_COLORS[0]);
    const [kind, setKind] = useState<CategoryKind>(category?.type ?? defaultType ?? 'BOTH');
    const [nameError, setNameError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const { mutateAsync: create, isPending: creating } = useCreateCategory(workspaceId);
    const { mutateAsync: update, isPending: updating } = useUpdateCategory(workspaceId);
    const busy = creating || updating;

    const handleSubmit = async () => {
        const trimmed = name.trim();
        if (!trimmed) {
            setNameError('Name is required');
            return;
        }
        setNameError(null);
        setError(null);
        try {
            const saved = isEdit
                ? await update({ id: category!.id, data: { name: trimmed, color, type: kind } })
                : await create({ name: trimmed, color, type: kind });
            notify.success(isEdit ? 'Category updated' : 'Category created');
            onSaved?.(saved);
            onClose();
        } catch (e) {
            setError(getErrorMessage(e, 'Failed to save category'));
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            size="sm"
            title={isEdit ? 'Edit category' : 'Add category'}
            description={isEdit ? undefined : 'Only visible in this workspace.'}
            footer={
                <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={onClose} disabled={busy}>
                        Cancel
                    </Button>
                    <PrimaryButton onClick={handleSubmit} loading={busy}>
                        {isEdit ? 'Save' : 'Create category'}
                    </PrimaryButton>
                </div>
            }
        >
            <div className="space-y-4">
                <CategoryFormFields
                    name={name}
                    nameError={nameError}
                    color={color}
                    kind={kind}
                    onNameChange={(value) => {
                        setName(value);
                        if (nameError) setNameError(null);
                    }}
                    onColorChange={setColor}
                    onKindChange={setKind}
                    onSubmit={handleSubmit}
                />
                {error && <p className="text-error text-sm">{error}</p>}
            </div>
        </Modal>
    );
}
