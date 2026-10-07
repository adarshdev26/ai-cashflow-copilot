import type { CalendarDay, CalendarEvent, CalendarEventKind } from '../types';

export type CashMovement = {
    type: 'CREDIT' | 'DEBIT' | 'TRANSFER';
    amount: number;
    accountId: string | null;
    toAccountId: string | null;
};

export type CalendarEntry = { event: CalendarEvent; delta: number };

export function round2(value: number): number {
    const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
    return rounded === 0 ? 0 : rounded;
}

/** Effect of one movement on the combined balance of the accounts in `scope`. */
export function cashDelta(movement: CashMovement, scope: ReadonlySet<string>): number {
    const from = movement.accountId !== null && scope.has(movement.accountId);
    const to = movement.toAccountId !== null && scope.has(movement.toAccountId);
    if (movement.type === 'CREDIT') return from ? movement.amount : 0;
    if (movement.type === 'DEBIT') return from ? -movement.amount : 0;
    return (to ? movement.amount : 0) - (from ? movement.amount : 0);
}

const KIND_RANK: Record<CalendarEventKind, number> = {
    INCOME: 0,
    EXPENSE: 1,
    TRANSFER: 2,
    GOAL_DEADLINE: 3,
    BUDGET_START: 4,
    BUDGET_END: 5,
};

function compareEvents(a: CalendarEvent, b: CalendarEvent): number {
    if (KIND_RANK[a.kind] !== KIND_RANK[b.kind]) return KIND_RANK[a.kind] - KIND_RANK[b.kind];
    const byAmount = (b.amount ?? 0) - (a.amount ?? 0);
    if (byAmount !== 0) return byAmount;
    return a.title.localeCompare(b.title) || a.id.localeCompare(b.id);
}

/**
 * One pass over the grid: group entries by day, total them, and carry a running
 * balance. `baseBalance` is the balance at the start of the first day.
 */
export function buildCalendarDays(
    keys: string[],
    baseBalance: number,
    entries: CalendarEntry[],
): CalendarDay[] {
    const byDate = new Map<string, CalendarEntry[]>();
    for (const entry of entries) {
        const list = byDate.get(entry.event.date);
        if (list) list.push(entry);
        else byDate.set(entry.event.date, [entry]);
    }

    let running = baseBalance;
    return keys.map((date) => {
        const list = byDate.get(date) ?? [];
        let income = 0;
        let expenses = 0;
        let transfers = 0;
        let delta = 0;

        for (const { event, delta: d } of list) {
            delta += d;
            const amount = event.amount ?? 0;
            if (event.kind === 'INCOME') income += amount;
            else if (event.kind === 'EXPENSE') expenses += amount;
            else if (event.kind === 'TRANSFER') transfers += amount;
        }

        running = round2(running + delta);
        return {
            date,
            income: round2(income),
            expenses: round2(expenses),
            transfers: round2(transfers),
            expectedBalance: running,
            events: list.map((entry) => entry.event).sort(compareEvents),
        };
    });
}
