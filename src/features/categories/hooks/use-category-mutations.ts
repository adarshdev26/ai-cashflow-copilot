import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCategory, updateCategory, deleteCategory } from '../api/categories-crud-api';
import type { CategoryInput, CategoryUpdate } from '../types';
import { invalidateReports } from '@/features/reports/hooks/report-invalidation';

function useInvalidateCategories(workspaceId: string, invalidatePlan = false) {
    const queryClient = useQueryClient();
    return () => {
        queryClient.invalidateQueries({ queryKey: ['categories', workspaceId] });
        // category names/colors appear in the ledger, stats and the donut chart
        queryClient.invalidateQueries({ queryKey: ['transactions', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['calendar'] });
        invalidateReports(queryClient);
        if (invalidatePlan) {
            void queryClient.invalidateQueries({ queryKey: ['plan'] });
        }
    };
}

export function useCreateCategory(workspaceId: string) {
    const invalidate = useInvalidateCategories(workspaceId, true);
    return useMutation({
        mutationFn: (data: CategoryInput) => createCategory(workspaceId, data),
        onSuccess: invalidate,
    });
}

export function useUpdateCategory(workspaceId: string) {
    const invalidate = useInvalidateCategories(workspaceId);
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: CategoryUpdate }) =>
            updateCategory(workspaceId, id, data),
        onSuccess: invalidate,
    });
}

export function useDeleteCategory(workspaceId: string) {
    const invalidate = useInvalidateCategories(workspaceId, true);
    return useMutation({
        mutationFn: (id: string) => deleteCategory(workspaceId, id),
        onSuccess: invalidate,
    });
}
