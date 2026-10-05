'use client';

import { useState } from 'react';
import { Button, PrimaryButton } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { notify, getErrorMessage } from '@/lib/ui/toast';
import { CATEGORY_COLORS } from '@/features/categories/constants';
import { CategoryFormFields } from '@/features/categories/components/CategoryFormFields';
import type { CategoryInput } from '@/features/categories/types';
import { useAdminCategoryMutations } from '../../hooks/use-admin-categories';
import type { AdminCategoryRow } from '../../types';

export function CategoryFormModal({ category, onClose }: { category: AdminCategoryRow | null; onClose: () => void }) {
  const mutations = useAdminCategoryMutations();
  const [name, setName] = useState(category?.name ?? '');
  const [color, setColor] = useState(category?.color ?? CATEGORY_COLORS[0]);
  const [kind, setKind] = useState(category?.type ?? 'BOTH');
  const [error, setError] = useState<string | null>(null);
  const busy = mutations.create.isPending || mutations.update.isPending;

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) { setError('Name is required'); return; }
    setError(null);
    const input: CategoryInput = { name: trimmed, color, type: kind };
    try {
      if (category) await mutations.update.mutateAsync({ id: category.id, data: input });
      else await mutations.create.mutateAsync(input);
      notify.success(category ? 'Global category updated' : 'Global category created');
      onClose();
    } catch (cause) {
      setError(getErrorMessage(cause, 'Failed to save category'));
    }
  };

  return <Modal open onClose={onClose} size="sm" title={category ? 'Edit global category' : 'Add global category'} description="Visible to every workspace."
    footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button><PrimaryButton onClick={submit} loading={busy}>{category ? 'Save' : 'Create category'}</PrimaryButton></div>}>
    <div className="space-y-4">
      <CategoryFormFields name={name} color={color} kind={kind} onNameChange={setName} onColorChange={setColor} onKindChange={setKind} onSubmit={submit} />
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  </Modal>;
}