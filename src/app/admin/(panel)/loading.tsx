export default function Loading() {
    return (
        <div
            className="mx-auto max-w-7xl animate-pulse space-y-8"
            aria-busy="true"
            aria-label="Loading admin page"
        >
            <div className="space-y-2">
                <div className="bg-base-300 h-7 w-48 rounded" />
                <div className="bg-base-300 h-4 w-72 max-w-full rounded" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }, (_, index) => (
                    <div
                        key={index}
                        className="border-base-300 bg-base-100 h-28 rounded-xl border"
                    />
                ))}
            </div>
            <div className="border-base-300 bg-base-100 space-y-3 rounded-xl border p-5">
                <div className="bg-base-300 h-4 w-40 rounded" />
                {Array.from({ length: 6 }, (_, index) => (
                    <div key={index} className="bg-base-200 h-10 rounded" />
                ))}
            </div>
        </div>
    );
}
