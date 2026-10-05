export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`px-2 py-0.5 text-xs font-medium rounded-full border ${
        active ? 'bg-success/10 text-success border-success/30' : 'bg-error/10 text-error border-error/30'
      }`}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}