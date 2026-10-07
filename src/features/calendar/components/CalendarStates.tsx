export function CalendarLoadingState() {
    return (
        <div
            className="border-base-300 bg-base-100 animate-pulse rounded-xl border p-3"
            aria-busy="true"
            aria-label="Loading calendar"
        >
            <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }).map((_, i) => (
                    <div key={i} className="bg-base-200 min-h-16 rounded-lg sm:min-h-24" />
                ))}
            </div>
        </div>
    );
}

export function CalendarErrorState({ message }: { message: string }) {
    return (
        <div
            role="alert"
            className="border-error/30 bg-error/10 text-error rounded-lg border p-3 text-sm"
        >
            {message}
        </div>
    );
}
