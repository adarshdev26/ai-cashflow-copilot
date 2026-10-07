export function GoalEmptyState({
    canManage,
    onCreate,
}: {
    canManage: boolean;
    onCreate: () => void;
}) {
    return (
        <div className="border-base-300 bg-base-100 rounded-xl border border-dashed p-12 text-center">
            <p className="text-base-content text-sm font-semibold">No savings goals yet</p>
            <p className="text-base-content/60 mt-1 text-sm">
                Create a goal to track progress toward a target.
            </p>
            {canManage && (
                <button type="button" onClick={onCreate} className="btn btn-primary btn-sm mt-4">
                    Create goal
                </button>
            )}
        </div>
    );
}

export function GoalLoadingState() {
    return (
        <div
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
            aria-label="Loading goals"
            aria-busy="true"
        >
            {Array.from({ length: 3 }, (_, index) => (
                <div
                    key={index}
                    className="border-base-300 bg-base-100 space-y-4 rounded-xl border p-5"
                >
                    <div className="bg-base-300 h-5 w-2/3 animate-pulse rounded" />
                    <div className="bg-base-300 h-3 w-full animate-pulse rounded" />
                    <div className="bg-base-300 h-4 w-1/2 animate-pulse rounded" />
                </div>
            ))}
        </div>
    );
}

export function GoalErrorState({ message }: { message: string }) {
    return (
        <div
            role="alert"
            className="border-error/30 bg-error/10 text-error rounded-lg border p-3 text-sm"
        >
            {message}
        </div>
    );
}
