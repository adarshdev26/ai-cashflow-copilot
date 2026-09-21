import { apiFetch } from '@/lib/api-client';
import { Category } from '../types';

export async function fetchCategories(): Promise<Category[]> {
  return apiFetch<Category[]>('/api/categories');
}
