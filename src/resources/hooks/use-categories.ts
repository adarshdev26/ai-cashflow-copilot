import { useQuery } from '@tanstack/react-query';
import { fetchCategories } from '../api/categories-api';
import { Category } from '../types';
import { useMemo } from 'react';

export const CATEGORIES_QUERY_KEY = ['categories'];

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
