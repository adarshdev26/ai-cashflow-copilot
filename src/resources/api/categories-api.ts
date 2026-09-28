import { apiFetch } from '@/lib/api-client';
import { Category, CategorySummary, DateRange } from '../types';

export async function fetchCategories(): Promise<Category[]> {
  return apiFetch<Category[]>('/api/categories');
}

export async function fetchCategoriesSummary(range: DateRange = {}): Promise<CategorySummary[]> {
  const params = new URLSearchParams();
  if (range.gte) params.set('gte', range.gte);
  if (range.lt) params.set('lt', range.lt);
  const qs = params.toString();

  return apiFetch<CategorySummary[]>(`/api/categories/summary${qs ? `?${qs}` : ''}`);
}