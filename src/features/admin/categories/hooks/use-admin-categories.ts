import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminCategoriesApi } from '../api/categories-api';
import type { CategoryInput, CategoryUpdate } from '@/features/categories/types';

export const adminCategoryKeys = {
    all: ['admin-categories'] as const,
    list: (params: Record<string, unknown>) => ['admin-categories', 'list', params] as const,
};

export function useAdminCategories(params: Record<string, unknown>) {
    return useQuery({
        queryKey: adminCategoryKeys.list(params),
        queryFn: () => adminCategoriesApi.list(params),
        placeholderData: (previous) => previous,
    });
}

function useInvalidateCategoryData() {
    const queryClient = useQueryClient();
    return () =>
        Promise.all([
            queryClient.invalidateQueries({ queryKey: adminCategoryKeys.all }),
            queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] }),
            queryClient.invalidateQueries({ queryKey: ['categories'] }),
            queryClient.invalidateQueries({ queryKey: ['transactions'] }),
            queryClient.invalidateQueries({ queryKey: ['budgets'] }),
            queryClient.invalidateQueries({ queryKey: ['recurring'] }),
            queryClient.invalidateQueries({ queryKey: ['transaction-templates'] }),
            queryClient.invalidateQueries({ queryKey: ['reports'] }),
        ]);
}

export function useAdminCategoryMutations() {
    const invalidate = useInvalidateCategoryData();
    return {
        create: useMutation({
            mutationFn: (input: CategoryInput) => adminCategoriesApi.create(input),
            onSuccess: invalidate,
        }),
        update: useMutation({
            mutationFn: (input: { id: string; data: CategoryUpdate }) =>
                adminCategoriesApi.update(input.id, input.data),
            onSuccess: invalidate,
        }),
        remove: useMutation({
            mutationFn: (id: string) => adminCategoriesApi.remove(id),
            onSuccess: invalidate,
        }),
    };
}
