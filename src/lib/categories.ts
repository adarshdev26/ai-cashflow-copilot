import { prisma } from '@/lib/db/prisma';

export const CATEGORY_NAME_MAX = 40;
const COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

export const CATEGORY_TYPES = ['CREDIT', 'DEBIT', 'BOTH'] as const;
export type CategoryKind = (typeof CATEGORY_TYPES)[number];
export type TxType = 'CREDIT' | 'DEBIT';

export const CATEGORY_SELECT = {
    id: true,
    name: true,
    color: true,
    workspaceId: true,
    type: true,
    isActive: true,
} as const;

/** Categories a workspace can see: all global ones + its own custom ones. */
export function visibleCategoryWhere(workspaceId: string) {
    return { OR: [{ workspaceId: null }, { workspaceId }] };
}

/** Returns an error message, or null if the category can be used. */
export async function getCategoryError(
    categoryId: string,
    workspaceId: string,
    opts: { type?: TxType; requireActive?: boolean } = {},
): Promise<string | null> {
    const c = await prisma.category.findFirst({
        where: { id: categoryId, ...visibleCategoryWhere(workspaceId) },
        select: { type: true, isActive: true },
    });
    if (!c) return 'Invalid category';
    if (opts.requireActive && !c.isActive) return 'This category is inactive';
    if (opts.type && c.type !== 'BOTH' && c.type !== opts.type) {
        return `This category is only for ${c.type === 'CREDIT' ? 'income' : 'expense'} transactions`;
    }
    return null;
}

/** Case-insensitive name clash against globals + this workspace's customs (inactive included). */
export async function findNameConflict(workspaceId: string, name: string, excludeId?: string) {
    return prisma.category.findFirst({
        where: {
            AND: [
                { name: { equals: name, mode: 'insensitive' } },
                visibleCategoryWhere(workspaceId),
                ...(excludeId ? [{ id: { not: excludeId } }] : []),
            ],
        },
        select: { id: true, workspaceId: true },
    });
}

/** Loads a category the caller may edit/delete (custom, same workspace). */
export async function loadCustomCategory(id: string, workspaceId: string) {
    const category = await prisma.category.findUnique({
        where: { id },
        select: { id: true, name: true, workspaceId: true },
    });
    if (!category || (category.workspaceId && category.workspaceId !== workspaceId)) {
        return { ok: false as const, status: 404, error: 'Category not found' };
    }
    if (!category.workspaceId) {
        return { ok: false as const, status: 403, error: 'Default categories cannot be changed' };
    }
    return { ok: true as const, category };
}

type CategoryData = {
    name?: string;
    color?: string | null;
    type?: CategoryKind;
    isActive?: boolean;
};
type ParsedInput = { ok: true; data: CategoryData } | { ok: false; error: string };

export function parseCategoryInput(body: unknown, partial = false): ParsedInput {
    if (!body || typeof body !== 'object') return { ok: false, error: 'Invalid request body' };
    const b = body as Record<string, unknown>;
    const data: CategoryData = {};

    if (!partial || b.name !== undefined) {
        if (typeof b.name !== 'string') return { ok: false, error: 'Name is required' };
        const name = b.name.trim().replace(/\s+/g, ' ');
        if (!name) return { ok: false, error: 'Name is required' };
        if (name.length > CATEGORY_NAME_MAX) {
            return { ok: false, error: `Name must be at most ${CATEGORY_NAME_MAX} characters` };
        }
        data.name = name;
    }

    if (b.color !== undefined) {
        if (b.color === null) data.color = null;
        else if (typeof b.color === 'string' && COLOR_REGEX.test(b.color))
            data.color = b.color.toUpperCase();
        else return { ok: false, error: 'Color must look like #RRGGBB' };
    }

    if (b.type !== undefined) {
        if (!CATEGORY_TYPES.includes(b.type as CategoryKind)) {
            return { ok: false, error: 'Type must be CREDIT, DEBIT or BOTH' };
        }
        data.type = b.type as CategoryKind;
    }

    if (b.isActive !== undefined) {
        if (typeof b.isActive !== 'boolean')
            return { ok: false, error: 'isActive must be true or false' };
        data.isActive = b.isActive;
    }

    if (partial && Object.keys(data).length === 0) return { ok: false, error: 'Nothing to update' };
    return { ok: true, data };
}
