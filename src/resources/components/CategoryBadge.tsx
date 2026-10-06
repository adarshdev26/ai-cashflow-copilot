import { Category } from '../types';

export function CategoryBadge({ category }: { category: Category | null | undefined }) {
    if (!category) {
        return (
            <div className="text-base-content/60 flex items-center gap-1.5 text-xs">
                <div className="bg-base-300 h-2 w-2 rounded-full" />
                <span>Uncategorized</span>
            </div>
        );
    }

    return (
        <div className="text-base-content/80 flex items-center gap-1.5 text-xs">
            <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: category.color || '#cbd5e1' }}
            />
            <span>{category.name}</span>
        </div>
    );
}
