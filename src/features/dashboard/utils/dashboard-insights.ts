// Pure helpers for the dashboard "Attention Required" and "Insights" sections.
// No React, no fetching: everything here is easy to unit test.

export const BUDGET_WARN_PCT = 80;
export const BUDGET_EXCEEDED_PCT = 100;
export const SPENDING_UP_ALERT_PCT = 15;
export const MIN_DAY_FOR_TREND = 7;
export const MAX_ALERTS = 5;

const DAY_MS = 24 * 60 * 60 * 1000;
const CASH_TYPES = ['CASH', 'BANK', 'WALLET'];

export type AlertSeverity = 'critical' | 'warning' | 'info';

export type DashboardAlert = {
    id: string;
    type: 'budget' | 'payment' | 'spending';
    severity: AlertSeverity;
    title: string;
    description: string;
    href: string;
    amount?: number;
};

// ---------- dates ----------

export function startOfDay(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function daysUntil(date: Date, now: Date = new Date()) {
    return Math.round((startOfDay(date) - startOfDay(now)) / DAY_MS);
}

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** First and last day of the current month as YYYY-MM-DD (local time). */
export function currentMonthRange(now: Date = new Date()) {
    return {
        from: iso(new Date(now.getFullYear(), now.getMonth(), 1)),
        to: iso(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
    };
}

// ---------- accounts ----------

export type AccountLike = {
    type: string;
    classification: string;
    isActive?: boolean;
    balance: number;
};

/** Active ASSET accounts of type CASH, BANK or WALLET. */
export function cashAvailable(accounts: AccountLike[]) {
    return accounts
        .filter(
            (a) =>
                a.isActive !== false && a.classification === 'ASSET' && CASH_TYPES.includes(a.type),
        )
        .reduce((sum, a) => sum + Number(a.balance), 0);
}

export function savingsRate(income: number, net: number) {
    return income > 0 ? Math.round((net / income) * 100) : null;
}

// ---------- budgets ----------

export type BudgetRow = { id: string; name: string; limit: number; spent: number };

type Loose = Record<string, unknown>;
const asObj = (v: unknown): Loose => (v && typeof v === 'object' ? (v as Loose) : {});
const num = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};

/**
 * Adapter between budgetsApi.usage and the dashboard.
 * If your usage payload uses different field names, adjust ONLY this function.
 */
export function toBudgetRows(raw: unknown): BudgetRow[] {
    const root = asObj(raw);
    const list: unknown[] = Array.isArray(raw)
        ? raw
        : Array.isArray(root.items)
            ? root.items
            : Array.isArray(root.budgets)
                ? root.budgets
                : [];

    return list.map((item, i) => {
        const r = asObj(item);
        const category = asObj(r.category);
        const name =
            [r.categoryName, category.name, r.name].find(
                (v): v is string => typeof v === 'string' && v.length > 0,
            ) ?? 'Budget';
        return {
            id: String(r.id ?? i),
            name,
            limit: num(r.limit ?? r.amount),
            spent: num(r.spent ?? r.used),
        };
    });
}

export function budgetAlerts(rows: BudgetRow[], fmt: (n: number) => string): DashboardAlert[] {
    return rows
        .filter((r) => r.limit > 0)
        .map((r) => ({ r, pct: (r.spent / r.limit) * 100 }))
        .filter(({ pct }) => pct >= BUDGET_WARN_PCT)
        .map(
            ({ r, pct }): DashboardAlert => ({
                id: `budget-${r.id}`,
                type: 'budget',
                severity: pct >= BUDGET_EXCEEDED_PCT ? 'critical' : 'warning',
                title:
                    pct >= BUDGET_EXCEEDED_PCT
                        ? `${r.name} budget exceeded`
                        : `${r.name} budget nearly used`,
                description: `${fmt(r.spent)} spent of ${fmt(r.limit)} (${Math.round(pct)}%)`,
                href: '/dashboard/budgets',
                amount: r.spent,
            }),
        );
}

// ---------- recurring ----------

export type RecurringLike = {
    id: string;
    isActive: boolean;
    type: string;
    amount: number | string;
    description?: string | null;
    nextRunAt?: string | Date | null;
};

/** Active expense (DEBIT) items that will be recorded today or tomorrow. */
export function dueSoonAlerts(
    recurring: RecurringLike[],
    fmt: (n: number) => string,
    now: Date = new Date(),
): DashboardAlert[] {
    const alerts: DashboardAlert[] = [];
    for (const r of recurring) {
        if (!r.isActive || r.type !== 'DEBIT' || !r.nextRunAt) continue;
        const d = daysUntil(new Date(r.nextRunAt), now);
        if (d < 0 || d > 1) continue;
        const name = r.description || 'A payment';
        alerts.push({
            id: `due-${r.id}`,
            type: 'payment',
            severity: 'warning',
            title: `${name} due ${d === 0 ? 'today' : 'tomorrow'}`,
            description: `${fmt(Number(r.amount))} will be recorded automatically`,
            href: '/dashboard/recurring',
            amount: Number(r.amount),
        });
    }
    return alerts;
}

/** Total of active DEBIT items due within the next `days` days (including today). */
export function upcomingDebitTotal(
    recurring: RecurringLike[],
    days: number,
    now: Date = new Date(),
) {
    return recurring.reduce((sum, r) => {
        if (!r.isActive || r.type !== 'DEBIT' || !r.nextRunAt) return sum;
        const d = daysUntil(new Date(r.nextRunAt), now);
        return d >= 0 && d <= days ? sum + Number(r.amount) : sum;
    }, 0);
}

// ---------- spending trend ----------

export type SpendingTrend = { pct: number; direction: 'up' | 'down' };

/**
 * Projects this month's spending at the current daily pace and compares it
 * with last month's full total. Returns null early in the month or when
 * there is no last-month baseline, to avoid false alarms.
 */
export function spendingTrend(
    thisExpense: number,
    lastExpense: number,
    now: Date = new Date(),
): SpendingTrend | null {
    const day = now.getDate();
    if (day < MIN_DAY_FOR_TREND || lastExpense <= 0) return null;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const projected = (thisExpense / day) * daysInMonth;
    const pct = ((projected - lastExpense) / lastExpense) * 100;
    if (Math.abs(pct) < 1) return null;
    return { pct: Math.round(Math.abs(pct)), direction: pct > 0 ? 'up' : 'down' };
}

export function spendingAlert(trend: SpendingTrend | null): DashboardAlert[] {
    if (!trend || trend.direction !== 'up' || trend.pct < SPENDING_UP_ALERT_PCT) return [];
    return [
        {
            id: 'spending-trend',
            type: 'spending',
            severity: 'warning',
            title: 'Spending is increasing',
            description: `At this pace you'll spend ${trend.pct}% more than last month`,
            href: '/dashboard/finance',
        },
    ];
}

// ---------- sorting ----------

const RANK: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };

export function sortAlerts(alerts: DashboardAlert[]) {
    return [...alerts].sort((a, b) => RANK[a.severity] - RANK[b.severity]).slice(0, MAX_ALERTS);
}