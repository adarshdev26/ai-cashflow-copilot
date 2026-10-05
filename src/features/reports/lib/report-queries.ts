import { prisma } from '@/lib/db/prisma';
import type {
  AccountRow,
  BudgetRow,
  CategoryRow,
  ReportFilters,
  ReportApiErrorCode,
  ReportResponse,
  SeriesPoint,
} from '../types';
import {
  budgetStatus,
  bucketKey,
  bucketKeys,
  buildReportWhere,
  pickGranularity,
  round2,
  savingsRate,
  singleFullMonth,
  type DateRange,
} from './report-filters';

export const REPORT_SERIES_ROW_CAP = 200_000;

export class ReportSeriesTooLargeError extends Error {
  readonly code: ReportApiErrorCode = 'SERIES_TOO_LARGE';

  constructor() {
    super('Too many transactions in this range. Narrow the date range.');
    this.name = 'ReportSeriesTooLargeError';
  }
}

/** Returns an error message if an id doesn't belong to this workspace, else null. */
export async function validateScopedIds(
  workspaceId: string,
  f: ReportFilters
): Promise<string | null> {
  if (f.accountId) {
    const acc = await prisma.financialAccount.findFirst({
      where: { id: f.accountId, workspaceId },
      select: { id: true },
    });
    if (!acc) return 'Account not found';
  }
  if (f.categoryId) {
    const cat = await prisma.category.findFirst({
      where: { id: f.categoryId, OR: [{ workspaceId }, { workspaceId: null }] },
      select: { id: true },
    });
    if (!cat) return 'Category not found';
  }
  return null;
}

export async function buildReport(
  workspaceId: string,
  filters: ReportFilters,
  range: DateRange,
  tz: number,
  timeZone?: string
): Promise<ReportResponse> {
  const where = buildReportWhere(workspaceId, filters, range);
  const granularity = pickGranularity(range);
  const debitWhere = { ...where, type: 'DEBIT' as const };
  const skipSpending = filters.type === 'CREDIT';

  const [byType, byAccountType, byCategory, rows, top, accountOptions, categoryOptions] =
    await Promise.all([
      prisma.transaction.groupBy({
        by: ['type'],
        where,
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.transaction.groupBy({
        by: ['accountId', 'type'],
        where,
        _sum: { amount: true },
        _count: { _all: true },
      }),
      skipSpending
        ? Promise.resolve([])
        : prisma.transaction.groupBy({
            by: ['categoryId'],
            where: debitWhere,
            _sum: { amount: true },
          }),
      prisma.transaction.findMany({
        where,
        select: { createdAt: true, type: true, amount: true },
        take: REPORT_SERIES_ROW_CAP + 1,
      }),
      skipSpending
        ? Promise.resolve([])
        : prisma.transaction.findMany({
            where: debitWhere,
            orderBy: [{ amount: 'desc' }, { createdAt: 'desc' }],
            take: 10,
            select: {
              id: true,
              description: true,
              amount: true,
              createdAt: true,
              account: { select: { name: true } },
              category: { select: { name: true } },
            },
          }),
      prisma.financialAccount.findMany({
        where: { workspaceId },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      prisma.category.findMany({
        where: { isActive: true, OR: [{ workspaceId }, { workspaceId: null }] },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
    ]);

  if (rows.length > REPORT_SERIES_ROW_CAP) throw new ReportSeriesTooLargeError();

  // ---- summary ----
  let income = 0;
  let expenses = 0;
  let transactionCount = 0;
  for (const g of byType) {
    transactionCount += g._count._all;
    if (g.type === 'CREDIT') income = g._sum.amount ?? 0;
    else expenses = g._sum.amount ?? 0;
  }
  income = round2(income);
  expenses = round2(expenses);
  const summary = {
    income,
    expenses,
    netCashFlow: round2(income - expenses),
    savingsRate: savingsRate(income, expenses),
    transactionCount,
  };

  // ---- series (JS bucketing, empty buckets filled) ----
  const map = new Map<string, SeriesPoint>(
    bucketKeys(filters, granularity).map((key) => [key, { key, income: 0, expense: 0 }])
  );
  for (const r of rows) {
    const p = map.get(bucketKey(r.createdAt, tz, granularity, timeZone));
    if (!p) continue;
    if (r.type === 'CREDIT') p.income += r.amount;
    else p.expense += r.amount;
  }
  const series = [...map.values()].map((p) => ({
    ...p,
    income: round2(p.income),
    expense: round2(p.expense),
  }));

  // ---- spending by category (one lookup, no N+1) ----
  const catIds = byCategory.map((g) => g.categoryId).filter((v): v is string => !!v);
  const cats = catIds.length
    ? await prisma.category.findMany({
        where: { id: { in: catIds } },
        select: { id: true, name: true, color: true },
      })
    : [];
  const catById = new Map(cats.map((c) => [c.id, c]));
  const totalSpend = byCategory.reduce((s, g) => s + (g._sum.amount ?? 0), 0);
  const categories: CategoryRow[] = byCategory
    .map((g) => {
      const c = g.categoryId ? catById.get(g.categoryId) : undefined;
      const amount = round2(g._sum.amount ?? 0);
      return {
        categoryId: g.categoryId,
        name: c?.name ?? 'Uncategorized',
        color: c?.color ?? null,
        amount,
        percent: totalSpend > 0 ? Math.round((amount / totalSpend) * 1000) / 10 : 0,
      };
    })
    .sort((x, y) => y.amount - x.amount);

  // ---- account breakdown ----
  const accIds = [...new Set(byAccountType.map((g) => g.accountId).filter((v): v is string => !!v))];
  const accs = accIds.length
    ? await prisma.financialAccount.findMany({
        where: { id: { in: accIds }, workspaceId },
        select: { id: true, name: true, currency: true, isActive: true },
      })
    : [];
  const accById = new Map(accs.map((a) => [a.id, a]));
  const currencyTotals = new Map<
    string,
    { currency: string | null; income: number; expenses: number; transactionCount: number }
  >();
  for (const g of byAccountType) {
    const currency = g.accountId ? accById.get(g.accountId)?.currency ?? null : null;
    const key = currency ?? '__unknown__';
    const total = currencyTotals.get(key) ?? {
      currency,
      income: 0,
      expenses: 0,
      transactionCount: 0,
    };
    if (g.type === 'CREDIT') total.income += g._sum.amount ?? 0;
    else total.expenses += g._sum.amount ?? 0;
    total.transactionCount += g._count._all;
    currencyTotals.set(key, total);
  }
  const totalsByCurrency = [...currencyTotals.values()].map((total) => ({
    ...total,
    income: round2(total.income),
    expenses: round2(total.expenses),
    netCashFlow: round2(total.income - total.expenses),
  }));
  const accMap = new Map<string, AccountRow>();
  for (const g of byAccountType) {
    const key = g.accountId ?? '__none__';
    const a = g.accountId ? accById.get(g.accountId) : undefined;
    const row =
      accMap.get(key) ??
      ({
        accountId: g.accountId,
        name: a?.name ?? 'No account',
        currency: a?.currency ?? null,
        isActive: a?.isActive ?? true,
        income: 0,
        expense: 0,
        net: 0,
      } satisfies AccountRow);
    if (g.type === 'CREDIT') row.income += g._sum.amount ?? 0;
    else row.expense += g._sum.amount ?? 0;
    accMap.set(key, row);
  }
  const accounts = [...accMap.values()]
    .map((r) => ({
      ...r,
      income: round2(r.income),
      expense: round2(r.expense),
      net: round2(r.income - r.expense),
    }))
    .sort((x, y) => y.income + y.expense - (x.income + x.expense));
  const mixedCurrency = new Set(accounts.map((a) => a.currency).filter(Boolean)).size > 1;

  // ---- budgets ----
  const month = singleFullMonth(filters);
  const budget = filters.type === 'CREDIT'
    ? { available: false as const, reason: 'income_only' as const }
    : month
      ? { available: true as const, items: await loadBudgets(workspaceId, filters, range) }
      : { available: false as const, reason: 'range_not_single_month' as const };

  return {
    filters,
    granularity,
    mixedCurrency,
    summary,
    totalsByCurrency,
    series,
    categories,
    accounts,
    budget,
    topExpenses: top.map((t) => ({
      id: t.id,
      description: t.description ?? '',
      date: t.createdAt.toISOString(),
      amount: round2(t.amount),
      account: t.account?.name ?? null,
      category: t.category?.name ?? null,
    })),
    options: { accounts: accountOptions, categories: categoryOptions },
  };
}

async function loadBudgets(
  workspaceId: string,
  f: ReportFilters,
  range: DateRange
): Promise<BudgetRow[]> {
  const budgets = await prisma.budget.findMany({
    where: {
      workspaceId,
      isActive: true,
      period: 'MONTHLY',
      startDate: { lt: range.endExclusive },
      OR: [{ endDate: null }, { endDate: { gte: range.start } }],
      ...(f.categoryId ? { categoryId: f.categoryId } : {}),
    },
    select: { categoryId: true, amount: true },
  });
  if (budgets.length === 0) return [];

  const ids = budgets.map((b) => b.categoryId);
  const [spent, cats] = await Promise.all([
    prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        workspaceId,
        type: 'DEBIT',
        categoryId: { in: ids },
        createdAt: { gte: range.start, lt: range.endExclusive },
        ...(f.accountId ? { accountId: f.accountId } : {}),
      },
      _sum: { amount: true },
    }),
    prisma.category.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }),
  ]);
  const spentBy = new Map(spent.map((s) => [s.categoryId, s._sum.amount ?? 0]));
  const nameBy = new Map(cats.map((c) => [c.id, c.name]));

  return budgets
    .map((b) => {
      const s = round2(spentBy.get(b.categoryId) ?? 0);
      return {
        categoryId: b.categoryId,
        category: nameBy.get(b.categoryId) ?? 'Unknown',
        budget: round2(b.amount),
        spent: s,
        remaining: round2(b.amount - s),
        percentUsed: b.amount > 0 ? Math.round((s / b.amount) * 1000) / 10 : 0,
        status: budgetStatus(s, b.amount),
      };
    })
    .sort((x, y) => y.percentUsed - x.percentUsed);
}
