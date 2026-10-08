export const INSIGHT_TYPES = [
    'SPENDING_INCREASE',
    'BUDGET_WARNING',
    'LARGE_EXPENSE',
    'CASH_FLOW_CHANGE',
    'RECURRING_EXPENSE',
] as const;
export type InsightType = (typeof INSIGHT_TYPES)[number];
export type InsightSeverity = 'info' | 'warning' | 'critical';

export type EvidenceItem = {
    label: string;
    value: number | string;
    kind: 'currency' | 'percent' | 'text';
};

export type InsightCandidate = {
    id: string;
    type: InsightType;
    severity: InsightSeverity;
    evidence: EvidenceItem[];
};

export type InsightsResponse = {
    insights: Insight[];
    generatedAt: string;
    period: { from: string; to: string };
    cached: boolean;
};

export type Insight = InsightCandidate & { title: string; message: string };

export type InsightsRange = { gte: string; lt: string; prevGte: string; prevLt: string };