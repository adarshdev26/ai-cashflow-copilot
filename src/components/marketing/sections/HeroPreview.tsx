const stats = [
  { label: 'Income', value: '$4,200', tone: 'text-emerald-600' },
  { label: 'Expenses', value: '$2,850', tone: 'text-rose-600' },
  { label: 'Net balance', value: '$1,350', tone: 'text-mk-fg' },
];

export function HeroPreview() {
  return (
    <div className="mx-auto mt-14 max-w-3xl rounded-2xl border border-mk-line bg-mk-surface p-4 shadow-xl sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="rounded-md bg-mk-bg px-3 py-1 text-sm font-medium">Family budget ▾</span>
        <span className="text-xs text-mk-muted">Sample data</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-mk-line bg-mk-bg p-4">
            <p className="text-sm text-mk-muted">{s.label}</p>
            <p className={`mk-heading mt-1 text-2xl font-bold ${s.tone}`}>{s.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 space-y-2">
        {['Groceries', 'Salary', 'Electricity bill'].map((r) => (
          <div key={r} className="flex justify-between rounded-lg border border-mk-line bg-mk-bg px-4 py-3 text-sm">
            <span>{r}</span>
            <span className="text-mk-muted">Today</span>
          </div>
        ))}
      </div>
    </div>
  );
}