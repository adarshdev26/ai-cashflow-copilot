import { apiFetch, toQuery } from '../../shared/api/admin-api';
import type { CategoryInput, CategoryUpdate, CategoryItem } from '@/features/categories/types';
import type { AdminCategoryList } from '../types';

const json = (method: string, body?: unknown): RequestInit => ({
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
});

export const adminCategoriesApi = {
    list: (params: Record<string, unknown>) =>
        apiFetch<AdminCategoryList>(`/api/admin/categories?${toQuery(params)}`),
    create: (body: CategoryInput) =>
        apiFetch<CategoryItem>('/api/admin/categories', json('POST', body)),
    update: (id: string, body: CategoryUpdate) =>
        apiFetch<CategoryItem>(`/api/admin/categories/${id}`, json('PATCH', body)),
    remove: (id: string) =>
        apiFetch<{ id: string; usage: AdminCategoryList['data'][number]['usage'] }>(
            `/api/admin/categories/${id}`,
            json('DELETE'),
        ),
};
