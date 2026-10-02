'use client';
import { useState } from 'react';
import { Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import { PrimaryButton } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useCategories } from '@/resources/hooks/use-categories';
import { useActiveWorkspaceId, usePermission } from '@/features/workspaces';
import { notify, getErrorMessage } from '@/lib/toast';
import { CategoryFormModal } from '@/features/categories/components/CategoryFormModal';
import { useDeleteCategory, useUpdateCategory } from '@/features/categories/hooks/use-category-mutations';
import type { CategoryItem } from '@/features/categories/types';

const TYPE_LABEL = { BOTH: 'Both', DEBIT: 'Expense', CREDIT: 'Income' } as const;

function Dot({ color }: { color: string | null }) {
  return <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: color ?? '#94a3b8' }} />;
}

function TypeBadge({ type }: { type: CategoryItem['type'] }) {
  return (
    <span className="rounded-full bg-base-200 px-2 py-0.5 text-xs text-base-content/60">
      {TYPE_LABEL[type] ?? 'Both'}
    </span>
  );
}

export default function CategoriesPage() {
  const workspaceId = useActiveWorkspaceId();
  const canCreate = usePermission('category.create');
  const canUpdate = usePermission('category.update');
  const canDelete = usePermission('category.delete');
  const { data, isLoading } = useCategories();
  const { mutate: remove, isPending: deleting } = useDeleteCategory(workspaceId);
  const { mutate: update } = useUpdateCategory(workspaceId);

  const [form, setForm] = useState<{ category: CategoryItem | null } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryItem | null>(null);

  const all = (data ?? []) as CategoryItem[];
  const custom = all.filter((c) => c.workspaceId);
  const global = all.filter((c) => !c.workspaceId);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-base-content">Categories</h1>
          <p className="text-sm text-base-content/60">Default categories are shared. Custom ones belong to this workspace only.</p>
        </div>
        {canCreate && (
          <PrimaryButton onClick={() => setForm({ category: null })} leftIcon={<Plus className="h-4 w-4" />}>
            Add category
          </PrimaryButton>
        )}
      </div>

      <section className="rounded-xl border border-base-300 bg-base-100">
        <h2 className="border-b border-base-200 px-4 py-3 text-sm font-semibold text-base-content">
          Custom categories
        </h2>
        {isLoading ? (
          <div className="h-24 animate-pulse bg-base-200" />
        ) : custom.length === 0 ? (
          <p className="px-4 py-6 text-sm text-base-content/60">No custom categories yet.</p>
        ) : (
          <ul className="divide-y divide-base-200">
            {custom.map((c) => (
              <li key={c.id} className="flex items-center justify-between px-4 py-3">
                <span className={`flex items-center gap-3 text-sm ${c.isActive ? 'text-base-content' : 'text-base-content/50'}`}>
                  <Dot color={c.color} />
                  {c.name}
                  <TypeBadge type={c.type} />
                  {!c.isActive && <span className="text-xs">Inactive</span>}
                </span>
                <span className="flex items-center gap-1">
                  {canUpdate && (
                    <button
                      type="button"
                      aria-label={c.isActive ? `Deactivate ${c.name}` : `Activate ${c.name}`}
                      title={c.isActive ? 'Deactivate' : 'Activate'}
                      onClick={() =>
                        update(
                          { id: c.id, data: { isActive: !c.isActive } },
                          {
                            onSuccess: () => notify.success(c.isActive ? 'Category deactivated' : 'Category activated'),
                            onError: (e) => notify.error(getErrorMessage(e, 'Failed to update category')),
                          }
                        )
                      }
                      className="rounded p-2 text-base-content/60 hover:bg-base-200 hover:text-base-content/80"
                    >
                      {c.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  )}
                  {canUpdate && (
                    <button type="button" aria-label={`Edit ${c.name}`} onClick={() => setForm({ category: c })}
                      className="rounded p-2 text-base-content/60 hover:bg-base-200 hover:text-base-content/80">
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                  {canDelete && (
                    <button type="button" aria-label={`Delete ${c.name}`} onClick={() => setDeleteTarget(c)}
                      className="rounded p-2 text-base-content/60 hover:bg-error/10 hover:text-error">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-base-300 bg-base-100">
        <h2 className="border-b border-base-200 px-4 py-3 text-sm font-semibold text-base-content">
          Default categories <span className="ml-2 text-xs font-normal text-base-content/50">read-only</span>
        </h2>
        <ul className="grid gap-x-6 px-4 py-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {global.map((c) => (
            <li key={c.id} className="flex items-center gap-3 py-1.5 text-sm text-base-content/80">
              <Dot color={c.color} />
              {c.name}
              <TypeBadge type={c.type} />
            </li>
          ))}
        </ul>
      </section>

      {form && workspaceId && (
        <CategoryFormModal
          open
          onClose={() => setForm(null)}
          workspaceId={workspaceId}
          category={form.category}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          isOpen
          title="Delete category"
          description={`Delete "${deleteTarget.name}"? Transactions that use it will become uncategorized. This can't be undone. To keep them categorized, deactivate it instead.`}
          confirmText="Delete"
          variant="danger"
          loading={deleting}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() =>
            remove(deleteTarget.id, {
              onSuccess: (r) => {
                setDeleteTarget(null);
                notify.success(r.affectedTransactions ? `Deleted. ${r.affectedTransactions} transactions are now uncategorized` : 'Category deleted');
              },
              onError: (e) => notify.error(getErrorMessage(e, 'Failed to delete category')),
            })
          }
        />
      )}
    </div>
  );
}