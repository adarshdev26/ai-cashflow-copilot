import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchCategories, fetchCategoriesSummary } from '../api/categories-api';
import { Category, CategorySummary, DateRange } from '../types';

export const CATEGORIES_QUERY_KEY = ['categories'];
export const CATEGORIES_SUMMARY_QUERY_KEY = ['transactions', 'category-summary'];

export function useCategories() {
  return useQuery({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: fetchCategories,
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
 * Per-category income/expense/net totals (GET /api/finance/categories/summary).
 * Key starts with 'transactions' so the existing
 * invalidateQueries({ queryKey: ['transactions'] }) in the create / update /
 * delete mutations refreshes these cards automatically. Pass a range for
 * "this month" etc.; omit it for all-time totals.
 */
export function useCategorySummary(range: DateRange = {}) {
  return useQuery({
    queryKey: [...CATEGORIES_SUMMARY_QUERY_KEY, range],
    queryFn: () => fetchCategoriesSummary(range),
  });
}

export function useCategorySummaryMap(range: DateRange = {}) {
  const { data: summaries } = useCategorySummary(range);

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