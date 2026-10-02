'use client';

export type TabItem<T extends string> = { id: T; label: string; icon?: React.ReactNode };

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: readonly TabItem<T>[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div role="tablist" className="tabs tabs-border border-b border-base-300">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
          className={`tab gap-2 ${active === t.id ? 'tab-active' : ''}`}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  );
}