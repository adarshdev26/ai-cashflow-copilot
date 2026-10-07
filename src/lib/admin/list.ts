export function parseListParams(
    url: URL,
    allowedSort: readonly string[],
    defaultSort: string,
    maxLimit = 100,
) {
    const sp = url.searchParams;
    const page = Math.max(1, Number(sp.get('page')) || 1);
    const limit = Math.min(maxLimit, Math.max(1, Number(sp.get('limit')) || 20));
    const sortRaw = sp.get('sortBy');
    const sortBy = sortRaw && allowedSort.includes(sortRaw) ? sortRaw : defaultSort;
    const sortDir: 'asc' | 'desc' = sp.get('sortDir') === 'asc' ? 'asc' : 'desc';
    const isActiveRaw = sp.get('isActive');
    const isActive = isActiveRaw === 'true' ? true : isActiveRaw === 'false' ? false : undefined;
    const search = sp.get('search')?.trim() || undefined;
    return { page, limit, skip: (page - 1) * limit, sortBy, sortDir, isActive, search };
}

export function paginationMeta(page: number, limit: number, totalCount: number) {
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    return { page, limit, totalCount, totalPages, hasMore: page < totalPages };
}
