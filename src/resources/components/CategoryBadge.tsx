import { Category } from '../types';

export function CategoryBadge({ category }: { category: Category | null | undefined }) {
  if (!category) {
    return (
      <div className="flex items-center gap-1.5 text-slate-500 text-xs">
        <div className="w-2 h-2 rounded-full bg-slate-300" />
        <span>Uncategorized</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-slate-700 text-xs">
      <div 
        className="w-2 h-2 rounded-full" 
        style={{ backgroundColor: category.color || '#cbd5e1' }} 
      />
      <span>{category.name}</span>
    </div>
  );
}
