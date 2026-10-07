'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { usePermission } from '@/features/workspaces/hooks/use-permission';
import { useActiveWorkspaceId } from '@/features/workspaces/WorkspaceProvider';
import { useUserLocale } from '@/features/settings/hooks/use-settings';
import { notify } from '@/lib/ui/toast';
import { GoalArchiveDialog } from './GoalArchiveDialog';
import { GoalCard } from './GoalCard';
import { GoalContributionModal } from './GoalContributionModal';
import { GoalFormModal } from './GoalFormModal';
import { GoalEmptyState, GoalErrorState, GoalLoadingState } from './GoalStates';
import { useGoals, useRestoreGoal } from '../hooks/use-goals';
import type { Goal, GoalContributionKind } from '../types';

export function GoalsDashboard() {
    const canManage = usePermission('goals.manage');
    const workspaceId = useActiveWorkspaceId();
    const locale = useUserLocale();
    const [includeArchived, setIncludeArchived] = useState(false);
    const { data, isLoading, isError, error } = useGoals(includeArchived, workspaceId);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Goal | null>(null);
    const [contribution, setContribution] = useState<{
        goal: Goal;
        kind: GoalContributionKind;
    } | null>(null);
    const [archiving, setArchiving] = useState<Goal | null>(null);
    const restore = useRestoreGoal();
    const goals = data?.goals ?? [];
    function create() {
        setEditing(null);
        setFormOpen(true);
    }
    async function restoreGoal(goal: Goal) {
        try {
            await restore.mutateAsync(goal.id);
            notify.success('Goal restored');
        } catch (cause) {
            notify.error(cause instanceof Error ? cause.message : 'Failed to restore goal');
        }
    }

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-base-content text-2xl font-bold">Savings goals</h1>
                    <p className="text-base-content/60 text-sm">
                        Track progress toward what you are saving for.
                    </p>
                </div>
                {canManage && <Button onClick={create}>New goal</Button>}
            </div>
            <label className="text-base-content/70 flex w-fit items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={includeArchived}
                    onChange={(event) => setIncludeArchived(event.target.checked)}
                />
                Show archived
            </label>
            {isError ? (
                <GoalErrorState
                    message={error instanceof Error ? error.message : 'Failed to load goals'}
                />
            ) : isLoading ? (
                <GoalLoadingState />
            ) : goals.length === 0 ? (
                <GoalEmptyState canManage={canManage} onCreate={create} />
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {goals.map((goal) => (
                        <GoalCard
                            key={goal.id}
                            goal={goal}
                            locale={locale}
                            canManage={canManage}
                            onEdit={(selected) => {
                                setEditing(selected);
                                setFormOpen(true);
                            }}
                            onContribute={(selected, kind) =>
                                setContribution({ goal: selected, kind })
                            }
                            onArchive={setArchiving}
                            onRestore={restoreGoal}
                        />
                    ))}
                </div>
            )}
            {formOpen && (
                <GoalFormModal
                    key={editing?.id ?? 'new'}
                    isOpen
                    onClose={() => setFormOpen(false)}
                    editing={editing}
                />
            )}
            {contribution && (
                <GoalContributionModal
                    key={`${contribution.goal.id}-${contribution.kind}`}
                    goal={contribution.goal}
                    mode={contribution.kind}
                    onClose={() => setContribution(null)}
                />
            )}
            <GoalArchiveDialog goal={archiving} onClose={() => setArchiving(null)} />
        </div>
    );
}
