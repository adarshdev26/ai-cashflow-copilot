export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse space-y-8" aria-busy="true" aria-label="Loading admin page">
      <div className="space-y-2">
        <div className="h-7 w-48 rounded bg-base-300" />
        <div className="h-4 w-72 max-w-full rounded bg-base-300" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="h-28 rounded-xl border border-base-300 bg-base-100" />
        ))}
      </div>
      <div className="space-y-3 rounded-xl border border-base-300 bg-base-100 p-5">
        <div className="h-4 w-40 rounded bg-base-300" />
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-10 rounded bg-base-200" />
        ))}
      </div>
    </div>
  );
}
