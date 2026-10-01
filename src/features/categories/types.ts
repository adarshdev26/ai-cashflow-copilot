export type CategoryKind = 'CREDIT' | 'DEBIT' | 'BOTH';

export type CategoryItem = {
  id: string;
  name: string;
  color: string | null;
  workspaceId: string | null; // null = global
  type: CategoryKind;
  isActive: boolean;
};

export type CategoryInput = { name: string; color: string | null; type: CategoryKind };
export type CategoryUpdate = Partial<CategoryInput> & { isActive?: boolean };