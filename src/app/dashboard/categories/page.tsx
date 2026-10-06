'use client';
import { useState } from 'react';
import { Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import { PrimaryButton } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useCategories } from '@/resources/hooks/use-categories';
import { useActiveWorkspaceId, usePermission } from '@/features/workspaces';
import { notify, getErrorMessage } from '@/lib/ui/toast';
import { CategoryFormModal } from '@/features/categories/components/CategoryFormModal';
import {
    useDeleteCategory,
    useUpdateCategory,
} from '@/features/categories/hooks/use-category-mutations';
import type { CategoryItem } from '@/features/categories/types';

const TYPE_LABEL = { BOTH: 'Both', DEBIT: 'Expense', CREDIT: 'Income' } as const;

function Dot({ color }: { color: string | null }) {
    return (
        <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: color ?? '#94a3b8' }}
        />
    );
}

function TypeBadge({ type }: { type: CategoryItem['type'] }) {
    return (
        <span className="bg-base-200 text-base-content/60 rounded-full px-2 py-0.5 text-xs">
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
        <div className="mx-auto max-w-7xl space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-base-content text-2xl font-bold tracking-tight">
                        Categories
                    </h1>
                    <p className="text-base-content/60 text-sm">
                        Default categories are shared. Custom ones belong to this workspace only.
                    </p>
                </div>
                {canCreate && (
                    <PrimaryButton
                        data-tour="categories-add-btn"
                        onClick={() => setForm({ category: null })}
                        leftIcon={<Plus className="h-4 w-4" />}
                    >
                        Add category
                    </PrimaryButton>
                )}
            </div>

            <section
                className="border-base-300 bg-base-100 rounded-xl border"
                data-tour="categories-list"
            >
                <h2 className="border-base-200 text-base-content border-b px-4 py-3 text-sm font-semibold">
                    Custom categories
                </h2>
                {isLoading ? (
                    <div className="bg-base-200 h-24 animate-pulse" />
                ) : custom.length === 0 ? (
                    <p className="text-base-content/60 px-4 py-6 text-sm">
                        No custom categories yet.
                    </p>
                ) : (
                    <ul className="divide-base-200 divide-y" data-tour="categories-actions">
                        {custom.map((c) => (
                            <li
                                key={c.id}
                                className="flex items-start justify-between gap-2 px-4 py-3"
                            >
                                <span
                                    className={`flex min-w-0 flex-1 flex-wrap items-center gap-3 text-sm break-words ${c.isActive ? 'text-base-content' : 'text-base-content/50'}`}
                                >
                                    <Dot color={c.color} />
                                    <span className="min-w-0 break-all">{c.name}</span>
                                    <TypeBadge type={c.type} />
                                    {!c.isActive && <span className="text-xs">Inactive</span>}
                                </span>
                                <span className="flex shrink-0 items-center gap-1">
                                    {canUpdate && (
                                        <button
                                            type="button"
                                            aria-label={
                                                c.isActive
                                                    ? `Deactivate ${c.name}`
                                                    : `Activate ${c.name}`
                                            }
                                            title={c.isActive ? 'Deactivate' : 'Activate'}
                                            onClick={() =>
                                                update(
                                                    { id: c.id, data: { isActive: !c.isActive } },
                                                    {
                                                        onSuccess: () =>
                                                            notify.success(
                                                                c.isActive
                                                                    ? 'Category deactivated'
                                                                    : 'Category activated',
                                                            ),
                                                        onError: (e) =>
                                                            notify.error(
                                                                getErrorMessage(
                                                                    e,
                                                                    'Failed to update category',
                                                                ),
                                                            ),
                                                    },
                                                )
                                            }
                                            className="text-base-content/60 hover:bg-base-200 hover:text-base-content/80 min-h-11 min-w-11 rounded p-2 sm:min-h-0 sm:min-w-0"
                                        >
                                            {c.isActive ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    )}
                                    {canUpdate && (
                                        <button
                                            type="button"
                                            aria-label={`Edit ${c.name}`}
                                            onClick={() => setForm({ category: c })}
                                            className="text-base-content/60 hover:bg-base-200 hover:text-base-content/80 min-h-11 min-w-11 rounded p-2 sm:min-h-0 sm:min-w-0"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                    )}
                                    {canDelete && (
                                        <button
                                            type="button"
                                            aria-label={`Delete ${c.name}`}
                                            onClick={() => setDeleteTarget(c)}
                                            className="text-base-content/60 hover:bg-error/10 hover:text-error min-h-11 min-w-11 rounded p-2 sm:min-h-0 sm:min-w-0"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section
                className="border-base-300 bg-base-100 rounded-xl border"
                data-tour="categories-defaults"
            >
                <h2 className="border-base-200 text-base-content border-b px-4 py-3 text-sm font-semibold">
                    Default categories{' '}
                    <span className="text-base-content/50 ml-2 text-xs font-normal">read-only</span>
                </h2>
                <ul className="grid gap-x-6 px-4 py-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {global.map((c) => (
                        <li
                            key={c.id}
                            className="text-base-content/80 flex items-center gap-3 py-1.5 text-sm"
                        >
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
                                notify.success(
                                    r.affectedTransactions
                                        ? `Deleted. ${r.affectedTransactions} transactions are now uncategorized`
                                        : 'Category deleted',
                                );
                            },
                            onError: (e) =>
                                notify.error(getErrorMessage(e, 'Failed to delete category')),
                        })
                    }
                />
            )}
        </div>
    );
}
