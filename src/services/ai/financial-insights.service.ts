import 'server-only';

import {
    getFinancialAnalytics,
    type FinancialAnalyticsResult,
} from '@/services/finance/financial-analytics.service';
import { gemini } from '@/services/ai/gemini.service';

const MODEL = 'gemini-3.8-flash';
const MAX_INSIGHTS = 5;

export const INSIGHT_TYPES = [
    'SPENDING_INCREASE',
    'BUDGET_WARNING',
    'LARGE_EXPENSE',
    'CASH_FLOW_CHANGE',
    'RECURRING_EXPENSE',
] as const;

export type InsightType = (typeof INSIGHT_TYPES)[number];

export const INSIGHT_SEVERITIES = ['INFO', 'WARNING', 'POSITIVE'] as const;

export type InsightSeverity = (typeof INSIGHT_SEVERITIES)[number];

export type FinancialInsight = {
    type: InsightType;
    title: string;
    message: string;
    severity: InsightSeverity;
};

export type FinancialInsightsResult = {
    insights: FinancialInsight[];
};

export type FinancialInsightsParams = {
    /** Must already be authorized by the caller. */
    workspaceId: string;
    /** Inclusive period start. */
    from: Date;
    /** Exclusive period end. */
    to: Date;
};

export type FinancialInsightsErrorCode =
    | 'INVALID_PERIOD'
    | 'ANALYTICS_FAILED'
    | 'GEMINI_FAILED'
    | 'EMPTY_RESPONSE'
    | 'INVALID_RESPONSE';

const ERROR_MESSAGES: Record<FinancialInsightsErrorCode, string> = {
    INVALID_PERIOD: 'Invalid date range',
    ANALYTICS_FAILED: 'Failed to load financial analytics',
    GEMINI_FAILED: 'Failed to generate financial insights',
    EMPTY_RESPONSE: 'Failed to generate financial insights',
    INVALID_RESPONSE: 'Failed to generate financial insights',
};

export class FinancialInsightsError extends Error {
    readonly code: FinancialInsightsErrorCode;

    constructor(code: FinancialInsightsErrorCode, message?: string) {
        super(message ?? ERROR_MESSAGES[code]);
        this.name = 'FinancialInsightsError';
        this.code = code;
    }
}

const SYSTEM_INSTRUCTION = `You are a financial insights assistant for CashFlow Copilot.

Analyze ONLY the supplied financial analytics JSON.
Do not invent numbers.
Do not invent transactions, categories, budgets, accounts, or financial facts.
Do not perform unsupported calculations.
Do not recalculate totals, percentages, or balances — use the exact figures from the JSON.
Do not assume information that is not present.
Do not provide investment, tax, legal, or other regulated financial advice.
Focus on factual observations and practical, low-risk recommendations.
Clearly distinguish observations from recommendations in the message text when both appear.
If the data does not support a useful insight, omit it.
Return no more than ${MAX_INSIGHTS} insights.
Return ONLY the requested JSON object. No markdown, no code fences, no commentary.

Allowed insight types (use only these):
- SPENDING_INCREASE
- BUDGET_WARNING
- LARGE_EXPENSE
- CASH_FLOW_CHANGE
- RECURRING_EXPENSE

Allowed severity values (use only these):
- INFO
- WARNING
- POSITIVE

Response shape (exact keys):
{
  "insights": [
    {
      "type": "SPENDING_INCREASE",
      "title": "short title",
      "message": "factual message using only supplied numbers",
      "severity": "INFO"
    }
  ]
}`;

const RESPONSE_JSON_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    required: ['insights'],
    properties: {
        insights: {
            type: 'array',
            maxItems: MAX_INSIGHTS,
            items: {
                type: 'object',
                additionalProperties: false,
                required: ['type', 'title', 'message', 'severity'],
                properties: {
                    type: { type: 'string', enum: [...INSIGHT_TYPES] },
                    title: { type: 'string' },
                    message: { type: 'string' },
                    severity: { type: 'string', enum: [...INSIGHT_SEVERITIES] },
                },
            },
        },
    },
} as const;

function isInsightType(value: unknown): value is InsightType {
    return typeof value === 'string' && (INSIGHT_TYPES as readonly string[]).includes(value);
}

function isInsightSeverity(value: unknown): value is InsightSeverity {
    return typeof value === 'string' && (INSIGHT_SEVERITIES as readonly string[]).includes(value);
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}

/** Strip ids before sending analytics to Gemini — names and numbers are enough. */
function toPromptAnalytics(analytics: FinancialAnalyticsResult) {
    return {
        currentPeriod: analytics.currentPeriod,
        previousPeriod: analytics.previousPeriod,
        comparison: analytics.comparison,
        categoryChanges: analytics.categoryChanges.map((c) => ({
            categoryName: c.categoryName,
            currentAmount: c.currentAmount,
            previousAmount: c.previousAmount,
            absoluteChange: c.absoluteChange,
            changePercent: c.changePercent,
        })),
        topExpenses: analytics.topExpenses.map((t) => ({
            description: t.description,
            amount: t.amount,
            date: t.date,
            categoryName: t.categoryName,
            accountName: t.accountName,
        })),
        recurringExpenses: analytics.recurringExpenses,
        budgets: analytics.budgets.map((b) => ({
            categoryName: b.categoryName,
            budgetAmount: b.budgetAmount,
            spentAmount: b.spentAmount,
            remainingAmount: b.remainingAmount,
            percentageUsed: b.percentageUsed,
            isExceeded: b.isExceeded,
        })),
        accountBalances: analytics.accountBalances.map((a) => ({
            accountName: a.accountName,
            balance: a.balance,
            currency: a.currency,
        })),
    };
}

function buildUserPrompt(analytics: FinancialAnalyticsResult, from: Date, to: Date): string {
    const payload = {
        period: {
            from: from.toISOString(),
            toExclusive: to.toISOString(),
        },
        analytics: toPromptAnalytics(analytics),
    };

    return [
        'Generate up to 5 financial insights from this analytics JSON.',
        'Use only the numbers and labels provided. Do not invent or alter figures.',
        JSON.stringify(payload),
    ].join('\n');
}

function parseJsonText(text: string): unknown {
    const trimmed = text.trim();
    if (!trimmed) {
        throw new FinancialInsightsError('EMPTY_RESPONSE');
    }

    try {
        return JSON.parse(trimmed);
    } catch {
        // Gemini sometimes wraps JSON despite mime type; reject rather than guess loosely.
        const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
        if (fenced?.[1]) {
            try {
                return JSON.parse(fenced[1].trim());
            } catch {
                throw new FinancialInsightsError('INVALID_RESPONSE');
            }
        }
        throw new FinancialInsightsError('INVALID_RESPONSE');
    }
}

/**
 * Validate Gemini output. Rejects anything outside the allowed insight contract.
 * Exported for focused unit tests if a test runner is added later.
 */
export function validateFinancialInsightsResponse(raw: unknown): FinancialInsightsResult {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
        throw new FinancialInsightsError('INVALID_RESPONSE');
    }

    const insights = (raw as { insights?: unknown }).insights;
    if (!Array.isArray(insights)) {
        throw new FinancialInsightsError('INVALID_RESPONSE');
    }
    if (insights.length > MAX_INSIGHTS) {
        throw new FinancialInsightsError('INVALID_RESPONSE');
    }

    const validated: FinancialInsight[] = [];
    for (const item of insights) {
        if (item === null || typeof item !== 'object' || Array.isArray(item)) {
            throw new FinancialInsightsError('INVALID_RESPONSE');
        }
        const row = item as Record<string, unknown>;
        const keys = Object.keys(row);
        if (keys.some((k) => !['type', 'title', 'message', 'severity'].includes(k))) {
            throw new FinancialInsightsError('INVALID_RESPONSE');
        }
        if (
            !isInsightType(row.type) ||
            !isNonEmptyString(row.title) ||
            !isNonEmptyString(row.message) ||
            !isInsightSeverity(row.severity)
        ) {
            throw new FinancialInsightsError('INVALID_RESPONSE');
        }

        validated.push({
            type: row.type,
            title: row.title.trim(),
            message: row.message.trim(),
            severity: row.severity,
        });
    }

    return { insights: validated };
}

/**
 * Build AI financial insights for an authorized workspace date range.
 * Uses getFinancialAnalytics as the sole source of financial figures.
 */
export async function getFinancialInsights(
    params: FinancialInsightsParams,
): Promise<FinancialInsightsResult> {
    const { workspaceId, from, to } = params;

    if (!(from instanceof Date) || Number.isNaN(from.getTime())) {
        throw new FinancialInsightsError('INVALID_PERIOD');
    }
    if (!(to instanceof Date) || Number.isNaN(to.getTime())) {
        throw new FinancialInsightsError('INVALID_PERIOD');
    }
    if (to <= from) {
        throw new FinancialInsightsError('INVALID_PERIOD');
    }

    let analytics: FinancialAnalyticsResult;
    try {
        analytics = await getFinancialAnalytics({ workspaceId, from, to });
    } catch (error) {
        if (error instanceof FinancialInsightsError) throw error;
        console.error('Financial insights: analytics failed');
        throw new FinancialInsightsError('ANALYTICS_FAILED');
    }

    let responseText: string | undefined;
    try {
        const response = await gemini.models.generateContent({
            model: MODEL,
            contents: buildUserPrompt(analytics, from, to),
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                temperature: 0.2,
                responseMimeType: 'application/json',
                responseJsonSchema: RESPONSE_JSON_SCHEMA,
            },
        });
        responseText = response.text?.trim();
    } catch (error) {
        if (error instanceof FinancialInsightsError) throw error;
        console.error('Financial insights: Gemini request failed');
        throw new FinancialInsightsError('GEMINI_FAILED');
    }

    if (!responseText) {
        console.error('Financial insights: empty Gemini response');
        throw new FinancialInsightsError('EMPTY_RESPONSE');
    }

    try {
        const parsed = parseJsonText(responseText);
        return validateFinancialInsightsResponse(parsed);
    } catch (error) {
        if (error instanceof FinancialInsightsError) {
            console.error('Financial insights: invalid Gemini response shape');
            throw error;
        }
        console.error('Financial insights: failed to parse Gemini response');
        throw new FinancialInsightsError('INVALID_RESPONSE');
    }
}
