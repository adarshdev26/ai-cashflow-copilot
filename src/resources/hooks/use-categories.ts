import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchCategories, fetchCategoriesSummary } from '../api/categories-api';
import { Category, CategorySummary, DateRange } from '../types';
import { useActiveWorkspaceId } from '@/features/workspaces';

export const CATEGORIES_QUERY_KEY = ['categories'] as const;

/** Globals + this workspace's custom categories. Key includes workspaceId. */
export function useCategories() {
  const workspaceId = useActiveWorkspaceId();
  return useQuery({
    queryKey: [...CATEGORIES_QUERY_KEY, workspaceId],
    queryFn: () => fetchCategories(workspaceId as string),
    enabled: Boolean(workspaceId),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,    // 30 minutes
    refetchOnWindowFocus: false,
  });
}

export function useCategoryMap() {
  const { data: categories } = useCategories();

  return useMemo(() => {
    const map: Record<string, Category> = {};
    if (categories) {
      for (const category of categories) {
        map[category.id] = category;
      }
    }
    return map;
  }, [categories]);
}

/**
 * Per-category income/expense/net totals (GET /api/categories/summary).
 * workspaceId is in the key, so switching workspace immediately fetches fresh data.
 * The key prefix 'transactions' means invalidateQueries({ queryKey: ['transactions', workspaceId] })
 * from the finance mutations also invalidates these cards.
 */
export function useCategorySummary(workspaceId: string, range: DateRange = {}) {
  return useQuery({
    queryKey: ['transactions', workspaceId, 'category-summary', range],
    queryFn: () => fetchCategoriesSummary(workspaceId, range),
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

export function useCategorySummaryMap(workspaceId: string, range: DateRange = {}) {
  const { data: summaries } = useCategorySummary(workspaceId, range);

  return useMemo(() => {
    const map: Record<string, CategorySummary> = {};
    if (summaries) {
      for (const summary of summaries) {
        map[summary.categoryId] = summary;
      }
    }
    return map;
  }, [summaries]);
}