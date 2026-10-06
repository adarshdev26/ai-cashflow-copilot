export function StatusBadge({ active }: { active: boolean }) {
    return (
        <span
            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${active ? 'border-success/30 bg-success/10 text-success' : 'border-error/30 bg-error/10 text-error'}`}
        >
            {active ? 'Active' : 'Inactive'}
        </span>
    );
}
