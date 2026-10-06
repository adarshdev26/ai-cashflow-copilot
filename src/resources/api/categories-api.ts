import { apiFetch, withWorkspace } from '@/lib/api-client';
import { Category, CategorySummary, DateRange } from '../types';

export async function fetchCategories(workspaceId: string): Promise<Category[]> {
    return apiFetch<Category[]>('/api/categories', withWorkspace(workspaceId));
}

export async function fetchCategoriesSummary(
    workspaceId: string,
    range: DateRange = {},
): Promise<CategorySummary[]> {
    const params = new URLSearchParams();
    if (range.gte) params.set('gte', range.gte);
    if (range.lt) params.set('lt', range.lt);
    const qs = params.toString();

    return apiFetch<CategorySummary[]>(
        `/api/categories/summary${qs ? `?${qs}` : ''}`,
        withWorkspace(workspaceId),
    );
}
