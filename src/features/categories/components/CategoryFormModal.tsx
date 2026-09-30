'use client';
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button, PrimaryButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { notify, getErrorMessage } from '@/lib/toast';
import { CATEGORY_COLORS } from '../constants';
import { useCreateCategory, useUpdateCategory } from '../hooks/use-category-mutations';
import type { CategoryItem } from '../types';

type Props = {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  category?: CategoryItem | null;            // set = edit mode
  onSaved?: (category: CategoryItem) => void; // inline add uses this to select the new category
};

export function CategoryFormModal({ open, onClose, workspaceId, category, onSaved }: Props) {
  const isEdit = Boolean(category);
  const [name, setName] = useState(category?.name ?? '');
  const [color, setColor] = useState(category?.color ?? CATEGORY_COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  const { mutateAsync: create, isPending: creating } = useCreateCategory(workspaceId);
  const { mutateAsync: update, isPending: updating } = useUpdateCategory(workspaceId);
  const busy = creating || updating;

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return setError('Name is required');
    setError(null);
    try {
      const saved = isEdit
        ? await update({ id: category!.id, data: { name: trimmed, color } })
        : await create({ name: trimmed, color });
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
          <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <PrimaryButton onClick={handleSubmit} loading={busy}>
            {isEdit ? 'Save' : 'Create category'}
          </PrimaryButton>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="category-name">Name</label>
          <Input
            id="category-name"
            value={name}
            maxLength={40}
            placeholder="e.g. Gym"
            autoFocus
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Color</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Color ${c}`}
                onClick={() => setColor(c)}
                className={`h-7 w-7 rounded-full border-2 ${color === c ? 'border-slate-900' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}