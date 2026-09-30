export type CategoryItem = {
  id: string;
  name: string;
  color: string | null;
  workspaceId: string | null; // null = global
};

export type CategoryInput = { name: string; color: string | null };