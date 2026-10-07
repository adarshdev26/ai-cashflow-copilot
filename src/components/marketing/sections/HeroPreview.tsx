import {
    LayoutDashboard,
    ReceiptText,
    CalendarDays,
    Repeat,
    LayoutTemplate,
    PiggyBank,
    Target,
    Landmark,
    Scale,
    Tags,
    BarChart3,
    LifeBuoy,
    Settings,
} from 'lucide-react';
import { cx } from '../primitives/cx';

const nav = [
    { icon: LayoutDashboard, label: 'Overview', active: true },
    { icon: ReceiptText, label: 'Transactions' },
    { icon: CalendarDays, label: 'Calendar' },
    { icon: Repeat, label: 'Recurring' },
    { icon: LayoutTemplate, label: 'Templates' },
    { icon: PiggyBank, label: 'Budgets' },
    { icon: Target, label: 'Goals' },
    { icon: Landmark, label: 'Accounts' },
    { icon: Scale, label: 'Net Worth' },
    { icon: Tags, label: 'Categories' },
    { icon: BarChart3, label: 'Reports' },
    { icon: LifeBuoy, label: 'Support' },
    { icon: Settings, label: 'Settings' },
];

const stats = [
    { label: 'Income', value: '$4,200', tone: 'text-emerald-500' },
    { label: 'Expenses', value: '$2,850', tone: 'text-rose-500' },
    { label: 'Net balance', value: '$1,350', tone: 'text-mk-fg' },
];

const bars = [38, 52, 44, 68, 57, 80, 62, 90, 74, 66, 84, 96];

const rows = [
    { name: 'Groceries', meta: 'Today', amount: '-$84.20', tone: 'text-rose-500' },
    { name: 'Salary', meta: 'Yesterday', amount: '+$4,200.00', tone: 'text-emerald-500' },
    { name: 'Electricity bill', meta: '2 days ago', amount: '-$61.75', tone: 'text-rose-500' },
];

export function HeroPreview() {
    return (
        <div className="bg-mk-surface flex text-left">
            <aside className="border-mk-line hidden w-52 shrink-0 overflow-y-auto border-r p-4 md:block">
                <p className="mk-heading mb-4 px-2 text-sm font-bold">Family budget ▾</p>
                <ul className="space-y-1">
                    {nav.map(({ icon: Icon, label, active }) => (
                        <li
                            key={label}
                            className={cx(
                                'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm',
                                active
                                    ? 'bg-mk-brand/15 text-mk-brand font-semibold'
                                    : 'text-mk-muted',
                            )}
                        >
                            <Icon size={16} aria-hidden /> {label}
                        </li>
                    ))}
                </ul>
            </aside>

            <div className="min-w-0 flex-1 space-y-4 p-4 sm:p-6">
                <div className="flex items-center justify-between">
                    <span className="bg-mk-bg rounded-md px-3 py-1 text-sm font-medium md:hidden">
                        Family budget ▾
                    </span>
                    <span className="hidden text-sm font-semibold md:block">Overview</span>
                    <span className="text-mk-muted text-xs">Sample data</span>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                    {stats.map((s) => (
                        <div
                            key={s.label}
                            className="border-mk-line bg-mk-bg rounded-xl border p-4"
                        >
                            <p className="text-mk-muted text-sm">{s.label}</p>
                            <p className={`mk-heading mt-1 text-2xl font-bold ${s.tone}`}>
                                {s.value}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="grid gap-3 lg:grid-cols-5">
                    <div className="border-mk-line bg-mk-bg rounded-xl border p-4 lg:col-span-3">
                        <p className="text-sm font-medium">Cash flow</p>
                        <div className="mt-4 flex h-32 items-end gap-2" aria-hidden>
                            {bars.map((h, i) => (
                                <div
                                    key={i}
                                    className="from-mk-brand/30 to-mk-brand flex-1 rounded-t-md bg-gradient-to-t"
                                    style={{ height: `${h}%` }}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2 lg:col-span-2">
                        {rows.map((r) => (
                            <div
                                key={r.name}
                                className="border-mk-line bg-mk-bg flex items-center justify-between rounded-lg border px-4 py-3 text-sm"
                            >
                                <span>
                                    <span className="block font-medium">{r.name}</span>
                                    <span className="text-mk-muted block text-xs">{r.meta}</span>
                                </span>
                                <span className={`font-semibold ${r.tone}`}>{r.amount}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
