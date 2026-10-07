export type CalendarEventKind =
    'INCOME' | 'EXPENSE' | 'TRANSFER' | 'GOAL_DEADLINE' | 'BUDGET_START' | 'BUDGET_END';

export type CalendarEventSource = 'schedule' | 'transaction' | 'goal' | 'budget';

export type CalendarEventMeta = {
    remainingAmount?: number;
    percentageCompleted?: number;
    requiredMonthlyContribution?: number | null;
    budgetAmount?: number;
};

export type CalendarEvent = {
    id: string;
    /** YYYY-MM-DD calendar day */
    date: string;
    kind: CalendarEventKind;
    title: string;
    /** Positive magnitude. The sign comes from `kind`. Null for goals and budgets. */
    amount: number | null;
    accountName: string | null;
    toAccountName: string | null;
    categoryName: string | null;
    source: CalendarEventSource;
    sourceId: string;
    /** True for a recurring occurrence that has not been posted yet. */
    isProjected: boolean;
    isRecurring: boolean;
    href: string | null;
    meta: CalendarEventMeta | null;
};

export type CalendarDay = {
    date: string;
    income: number;
    expenses: number;
    transfers: number;
    /** Balance at the end of this day: actual for past days, projected for future days. */
    expectedBalance: number;
    events: CalendarEvent[];
};

export type CalendarMonthResponse = {
    /** YYYY-MM */
    month: string;
    currency: string;
    asOf: string;
    /** Today in the requested time zone, YYYY-MM-DD */
    today: string;
    gridStart: string;
    gridEnd: string;
    weekStartsOn: number;
    accountId: string | null;
    /** True when the month had more posted transactions than the response cap. */
    truncated: boolean;
    days: CalendarDay[];
};
