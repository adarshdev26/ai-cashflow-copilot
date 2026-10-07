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

export type NetWorthSummary = {
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
    assets: NetWorthAccount[];
    liabilities: NetWorthAccount[];
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
                ? round2((Math.abs(account.amountOwed || account.balance || 0) / totalLiabilities) * 100)
                : null,
    }));

    return {
        totalAssets,
        totalLiabilities,
        netWorth: round2(totalAssets - totalLiabilities),
        assets: assetsWithShare,
        liabilities: liabilitiesWithShare,
    };
}

export type MonthPoint = {
    label: string;
    month: Date;
};

export function buildMonthEnds(
    range: string,
    now = new Date(),
    startFrom?: Date,
): MonthPoint[] {
    const endMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const requested = range === 'all' ? 60 : Number.parseInt(range.replace(/\D/g, ''), 10) || 6;
    const maximum = Math.min(Math.max(requested, 1), 60);

    let startMonth = new Date(endMonth);
    startMonth.setUTCMonth(endMonth.getUTCMonth() - (maximum - 1));

    if (startFrom) {
        const explicitStart = new Date(Date.UTC(startFrom.getUTCFullYear(), startFrom.getUTCMonth(), 1));
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
