import { prisma } from "./prisma";
export const CATEGORY_NAME_MAX = 40;
const COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

/** Categories a workspace can see: all global ones + its own custom ones. */
export function visibleCategoryWhere(workspaceId: string) {
    return { OR: [{ workspaceId: null }, { workspaceId }] };
}

/** True if the category is global or belongs to this workspace. */
export async function isCategoryUsable(categoryId: string, workspaceId: string) {
    const found = await prisma.category.findFirst({
        where: { id: categoryId, ...visibleCategoryWhere(workspaceId) },
        select: { id: true },
    });
    return Boolean(found);
}

/** Case-insensitive name clash against globals + this workspace's customs. */
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

/** Loads a category the caller is allowed to edit/delete (custom, same workspace). */
export async function loadCustomCategory(id: string, workspaceId: string) {
    const category = await prisma.category.findUnique({
        where: { id },
        select: { id: true, name: true, workspaceId: true },
    });
    // another workspace's category looks like "not found" so ids can't be probed
    if (!category || (category.workspaceId && category.workspaceId !== workspaceId)) {
        return { ok: false as const, status: 404, error: 'Category not found' };
    }
    if (!category.workspaceId) {
        return { ok: false as const, status: 403, error: 'Default categories cannot be changed' };
    }
    return { ok: true as const, category };
}

type ParsedInput =
    | { ok: true; data: { name?: string; color?: string | null } }
    | { ok: false; error: string };

export function parseCategoryInput(body: unknown, partial = false): ParsedInput {
    if (!body || typeof body !== 'object') return { ok: false, error: 'Invalid request body' };
    const b = body as Record<string, unknown>;
    const data: { name?: string; color?: string | null } = {};

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
        else if (typeof b.color === 'string' && COLOR_REGEX.test(b.color)) data.color = b.color.toUpperCase();
        else return { ok: false, error: 'Color must look like #RRGGBB' };
    }

    if (partial && Object.keys(data).length === 0) return { ok: false, error: 'Nothing to update' };
    return { ok: true, data };
}