export default function Loading() {
    return (
        <div
            className="mx-auto max-w-7xl animate-pulse space-y-8"
            aria-busy="true"
            aria-label="Loading dashboard"
        >
            <div className="space-y-2">
                <div className="bg-base-300 h-7 w-56 rounded" />
                <div className="bg-base-300 h-4 w-80 max-w-full rounded" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }, (_, index) => (
                    <div
                        key={index}
                        className="border-base-300 bg-base-100 space-y-3 rounded-xl border p-5"
                    >
                        <div className="bg-base-300 h-4 w-24 rounded" />
                        <div className="bg-base-300 h-7 w-32 rounded" />
                    </div>
                ))}
            </div>
            <div className="grid gap-5 lg:grid-cols-3">
                {Array.from({ length: 3 }, (_, index) => (
                    <div
                        key={index}
                        className="border-base-300 bg-base-100 h-64 rounded-xl border"
                    />
                ))}
            </div>
        </div>
    );
}
