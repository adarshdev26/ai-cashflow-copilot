import type { AccountClassification, AccountType } from '@/features/accounts/types';

export type NetWorthAccount = {
    id: string;
    name: string;
    type: AccountType;
    classification: AccountClassification;
    balance: number;
    amountOwed: number;
    currency: string;
    sharePercent: number | null;
};

export type NetWorthHistoryPoint = {
    label: string;
    month: string;
    netWorth: number;
    change: number;
    changePercent: number | null;
};

export type NetWorthSummary = {
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
    monthlyChange: number;
    monthlyChangePercent: number | null;
    assets: NetWorthAccount[];
    liabilities: NetWorthAccount[];
    history: NetWorthHistoryPoint[];
};

export function round2(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function computeMonthlyChange(current: number, previous: number): number {
    return round2(current - previous);
}

export function computeChangePercent(current: number, previous: number | null): number | null {
    if (previous == null || previous === 0) return null;
    return round2(((current - previous) / previous) * 100);
}

export function splitAccounts(accounts: NetWorthAccount[]): NetWorthSummary {
    const assets = accounts
        .filter((account) => account.classification === 'ASSET')
        .map((account) => ({
            ...account,
            sharePercent: null,
        }));

    const liabilities = accounts
        .filter((account) => account.classification === 'LIABILITY')
        .map((account) => ({
            ...account,
            amountOwed: Math.abs(account.amountOwed || account.balance || 0),
            sharePercent: null,
        }));

    const totalAssets = round2(
        assets.reduce((sum, account) => sum + Math.max(0, account.balance), 0),
    );
    const totalLiabilities = round2(
        liabilities.reduce(
            (sum, account) => sum + Math.abs(account.amountOwed || account.balance || 0),
            0,
        ),
    );

    const assetsWithShare = assets.map((account) => ({
        ...account,
        sharePercent:
            totalAssets > 0 ? round2((Math.max(0, account.balance) / totalAssets) * 100) : null,
    }));

    const liabilitiesWithShare = liabilities.map((account) => ({
        ...account,
        sharePercent:
            totalLiabilities > 0
                ? round2(
                      (Math.abs(account.amountOwed || account.balance || 0) / totalLiabilities) *
                          100,
                  )
                : null,
    }));

    const netWorth = round2(totalAssets - totalLiabilities);
    const history: NetWorthHistoryPoint[] = [
        {
            label: 'Current',
            month: 'current',
            netWorth,
            change: 0,
            changePercent: null,
        },
    ];

    return {
        totalAssets,
        totalLiabilities,
        netWorth,
        monthlyChange: 0,
        monthlyChangePercent: null,
        assets: assetsWithShare,
        liabilities: liabilitiesWithShare,
        history,
    };
}

export type MonthPoint = {
    label: string;
    month: Date;
};

export function buildMonthEnds(range: string, now = new Date(), startFrom?: Date): MonthPoint[] {
    const endMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const requested = range === 'all' ? 60 : Number.parseInt(range.replace(/\D/g, ''), 10) || 6;
    const maximum = Math.min(Math.max(requested, 1), 60);

    let startMonth = new Date(endMonth);
    startMonth.setUTCMonth(endMonth.getUTCMonth() - (maximum - 1));

    if (startFrom) {
        const explicitStart = new Date(
            Date.UTC(startFrom.getUTCFullYear(), startFrom.getUTCMonth(), 1),
        );
        if (explicitStart > startMonth) {
            startMonth = explicitStart;
        }
    }

    const points: MonthPoint[] = [];
    const cursor = new Date(startMonth);

    while (cursor <= endMonth) {
        points.push({
            label: `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, '0')}`,
            month: new Date(cursor),
        });
        cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }

    if (points.length > 60) {
        return points.slice(points.length - 60);
    }

    return points;
}

export function buildHistoryFromValues(
    range: string,
    values: Array<{ month: string; netWorth: number }>,
    now = new Date(),
): NetWorthHistoryPoint[] {
    const monthMap = new Map(values.map((value) => [value.month, value.netWorth]));
    const points = buildMonthEnds(range, now);

    return points.map((point, index) => {
        const monthKey = point.label;
        const netWorth = monthMap.get(monthKey) ?? 0;
        const previous = index === 0 ? null : points[index - 1];
        const previousValue = previous ? (monthMap.get(previous.label) ?? 0) : null;
        const change = previousValue == null ? 0 : computeMonthlyChange(netWorth, previousValue);
        const changePercent =
            previousValue == null || previousValue === 0
                ? null
                : computeChangePercent(netWorth, previousValue);

        return {
            label: point.label,
            month: point.label,
            netWorth: round2(netWorth),
            change: round2(change),
            changePercent,
        };
    });
}
