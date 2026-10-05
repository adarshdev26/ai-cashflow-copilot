import type { CategoryItem, CategoryKind } from '@/features/categories/types';
import type { Paged } from '../shared/types';

export type CategoryUsage = {
  transactions: number;
  budgets: number;
  recurringTransactions: number;
  transactionTemplates: number;
};

export type AdminCategoryRow = CategoryItem & {
  createdAt: string;
  updatedAt: string;
  usage: CategoryUsage;
};

export type AdminCategoryFilters = {
  search?: string;
  isActive?: string;
  type?: CategoryKind;
};

export type AdminCategorySortField = 'createdAt' | 'name' | 'type';
export type AdminCategoryList = Paged<AdminCategoryRow> & { customCategoryCount: number };