import { useCallback, useState } from 'react';

export interface UsePaginationOptions {
    defaultPage?: number;
    defaultPageSize?: number;
    maxPageSize?: number;
    totalPages?: number;
    totalCount?: number;
}

function positiveInteger(value: number, fallback: number) {
    return Number.isInteger(value) && value > 0 ? value : fallback;
}

export function usePagination({
    defaultPage = 1,
    defaultPageSize = 20,
    maxPageSize,
    totalPages,
    totalCount,
}: UsePaginationOptions = {}) {
    const initialPageSize = Math.min(
        positiveInteger(defaultPageSize, 20),
        maxPageSize ?? Number.MAX_SAFE_INTEGER,
    );

    const [page, setPageState] = useState(() => positiveInteger(defaultPage, 1));
    const [pageSize, setPageSizeState] = useState(initialPageSize);

    const [prevDefaultPageSize, setPrevDefaultPageSize] = useState(defaultPageSize);
    const [prevMaxPageSize, setPrevMaxPageSize] = useState(maxPageSize);

    if (prevDefaultPageSize !== defaultPageSize || prevMaxPageSize !== maxPageSize) {
        setPrevDefaultPageSize(defaultPageSize);
        setPrevMaxPageSize(maxPageSize);
        setPageSizeState(
            Math.min(positiveInteger(defaultPageSize, 20), maxPageSize ?? Number.MAX_SAFE_INTEGER),
        );
    }

    const resolvedTotalPages =
        totalPages ??
        (totalCount === undefined ? undefined : Math.max(1, Math.ceil(totalCount / pageSize)));

    const boundedPage = resolvedTotalPages ? Math.min(page, resolvedTotalPages) : page;

    const setPage = useCallback(
        (nextPage: number) => {
            setPageState((currentPage) => {
                const requestedPage = positiveInteger(nextPage, currentPage);
                return resolvedTotalPages
                    ? Math.min(requestedPage, resolvedTotalPages)
                    : requestedPage;
            });
        },
        [resolvedTotalPages],
    );

    const setPageSize = useCallback(
        (nextPageSize: number) => {
            const requestedPageSize = positiveInteger(nextPageSize, pageSize);
            setPageSizeState(Math.min(requestedPageSize, maxPageSize ?? Number.MAX_SAFE_INTEGER));
            setPageState(1);
        },
        [maxPageSize, pageSize],
    );

    const nextPage = useCallback(() => {
        if (resolvedTotalPages && boundedPage >= resolvedTotalPages) return;
        setPageState(boundedPage + 1);
    }, [boundedPage, resolvedTotalPages]);

    const previousPage = useCallback(() => {
        setPageState(Math.max(1, boundedPage - 1));
    }, [boundedPage]);

    const reset = useCallback(() => setPageState(1), []);

    return {
        page: boundedPage,
        pageSize,
        setPage,
        setPageSize,
        nextPage,
        previousPage,
        reset,
        hasNextPage: resolvedTotalPages === undefined || boundedPage < resolvedTotalPages,
        hasPreviousPage: boundedPage > 1,
    };
}
