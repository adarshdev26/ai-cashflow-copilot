export type Category = {
  id: string;
  name: string;
  color: string | null;
};

export type CategorySummary = {
  categoryId: string;
  name: string;
  color: string | null;
  income: number;
  expense: number;
  net: number;
  count: number;
};

export type DateRange = { gte?: string; lt?: string };
