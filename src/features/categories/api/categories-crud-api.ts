import { apiFetch, withWorkspace } from '@/lib/api-client';
import type { CategoryInput, CategoryItem } from '../types';

export async function createCategory(workspaceId: string, data: CategoryInput): Promise<CategoryItem> {
  return apiFetch<CategoryItem>('/api/categories', {
    ...withWorkspace(workspaceId),
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCategory(
  workspaceId: string,
  id: string,
  data: Partial<CategoryInput>
): Promise<CategoryItem> {
  return apiFetch<CategoryItem>(`/api/categories/${id}`, {
    ...withWorkspace(workspaceId),
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteCategory(
  workspaceId: string,
  id: string
): Promise<{ id: string; affectedTransactions: number }> {
  return apiFetch(`/api/categories/${id}`, { ...withWorkspace(workspaceId), method: 'DELETE' });
}