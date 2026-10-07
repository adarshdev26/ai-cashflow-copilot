'use client';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { notify } from '@/lib/ui/toast';
import { useArchiveGoal } from '../hooks/use-goals';
import type { Goal } from '../types';

export function GoalArchiveDialog({ goal, onClose }: { goal: Goal | null; onClose: () => void }) {
    const archive = useArchiveGoal();
    async function confirm() {
        if (!goal) return;
        try {
            await archive.mutateAsync(goal.id);
            notify.success('Goal archived');
            onClose();
        } catch (error) {
            notify.error(error instanceof Error ? error.message : 'Failed to archive goal');
        }
    }
    return (
        <ConfirmDialog
            isOpen={!!goal}
            title="Archive goal?"
            description={`Archive ${goal?.name ?? 'this goal'}? It will disappear from active goals, but its contribution history remains.`}
            confirmText="Archive"
            variant="danger"
            onConfirm={confirm}
            onClose={onClose}
            loading={archive.isPending}
        />
    );
}
