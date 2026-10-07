import { THEMES } from '@/lib/ui/themes';
import {
    PLAN_DEFAULTS,
    PLAN_FEATURES,
    PLAN_IDS,
    PLAN_LABELS,
    PLAN_LIMITS,
    planSettingKey,
    type PlanFeatureKey,
    type PlanLimitKey,
} from '@/lib/plans/constants';

/**
 * Single source of truth for every configurable setting.
 * Defaults == the old hard-coded values, so behaviour is unchanged
 * until someone edits a setting.
 */
export type SettingScope = 'system' | 'workspace' | 'user';
export type SettingValue = string | number | boolean;
export type EnumOption = { value: string | number; label: string };

type Base = {
    key: string;
    scope: SettingScope;
    group: string;
    label: string;
    description: string;
    /** true = safe to send to ordinary clients via /api/settings/public */
    public?: boolean;
};

export type SettingDef = Base &
    (
        | { type: 'number'; default: number; min: number; max: number; unit?: string }
        | { type: 'boolean'; default: boolean }
        | {
            type: 'string';
            default: string;
            minLength?: number;
            maxLength: number;
            format?: 'email';
        }
        | { type: 'enum'; default: string | number; options: readonly EnumOption[] }
    );

const num = (
    key: string,
    scope: SettingScope,
    group: string,
    label: string,
    description: string,
    def: number,
    min: number,
    max: number,
    unit?: string,
    pub = false,
): SettingDef => ({
    key,
    scope,
    group,
    label,
    description,
    type: 'number',
    default: def,
    min,
    max,
    unit,
    public: pub,
});

const bool = (
    key: string,
    scope: SettingScope,
    group: string,
    label: string,
    description: string,
    def: boolean,
    pub = false,
): SettingDef => ({
    key,
    scope,
    group,
    label,
    description,
    type: 'boolean',
    default: def,
    public: pub,
});

const str = (
    key: string,
    scope: SettingScope,
    group: string,
    label: string,
    description: string,
    def: string,
    maxLength: number,
    opts: { minLength?: number; format?: 'email'; pub?: boolean } = {},
): SettingDef => ({
    key,
    scope,
    group,
    label,
    description,
    type: 'string',
    default: def,
    maxLength,
    minLength: opts.minLength,
    format: opts.format,
    public: opts.pub,
});

const opt = (
    key: string,
    scope: SettingScope,
    group: string,
    label: string,
    description: string,
    def: string | number,
    options: readonly EnumOption[],
): SettingDef => ({ key, scope, group, label, description, type: 'enum', default: def, options });

const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
].map((label, i) => ({ value: i + 1, label }));

export const SETTING_GROUPS = {
    general: 'General',
    auth: 'Auth & security',
    limits: 'Limits',
    features: 'Features',
    defaults: 'Defaults & UI',
    plans: 'Plans',
} as const;

const PLAN_SETTING_DEFS: SettingDef[] = PLAN_IDS.flatMap((plan) => [
    ...(Object.keys(PLAN_LIMITS) as PlanLimitKey[]).map((key): SettingDef => ({
        key: planSettingKey(plan, key),
        scope: 'system',
        group: 'plans',
        label: `${PLAN_LABELS[plan]}: ${PLAN_LIMITS[key]}`,
        description: 'Use -1 for unlimited.',
        type: 'number',
        default: PLAN_DEFAULTS[plan].limits[key],
        min: -1,
        max: 100000,
    })),
    ...(Object.keys(PLAN_FEATURES) as PlanFeatureKey[]).map((key): SettingDef => ({
        key: planSettingKey(plan, key),
        scope: 'system',
        group: 'plans',
        label: `${PLAN_LABELS[plan]}: ${PLAN_FEATURES[key]}`,
        description: 'Turn on to include this feature in the plan.',
        type: 'boolean',
        default: PLAN_DEFAULTS[plan].features[key],
    })),
]);

export const SETTINGS: readonly SettingDef[] = [
    // ---------------- SYSTEM: general ----------------
    str(
        'branding.name',
        'system',
        'general',
        'Application name',
        'Shown in marketing pages and metadata.',
        'Cashflow Copilot',
        60,
        { minLength: 1, pub: true },
    ),
    str(
        'branding.tagline',
        'system',
        'general',
        'Tagline',
        'Short line under the name.',
        'Money, habits and notes, in one shared workspace.',
        140,
        { pub: true },
    ),
    str(
        'branding.description',
        'system',
        'general',
        'Application description',
        'Shown in marketing pages and metadata.',
        'Track income and expenses, keep family, business and side-project money in separate workspaces, and build better money habits, together.',
        200,
        { pub: true },
    ),
    str(
        'branding.supportEmail',
        'system',
        'general',
        'Support email',
        'Shown on contact and footer areas.',
        'hello@cashflowcopilot.com',
        120,
        { format: 'email', minLength: 3, pub: true },
    ),

    // ---------------- SYSTEM: auth ----------------
    bool(
        'auth.signupEnabled',
        'system',
        'auth',
        'Allow new signups',
        'When off, the signup API rejects new accounts.',
        true,
        true,
    ),
    num(
        'auth.passwordMinLength',
        'system',
        'auth',
        'Minimum password length',
        'Maximum stays fixed at 72 (bcrypt limit).',
        8,
        8,
        72,
        'characters',
        true,
    ),
    num(
        'auth.passwordResetExpiryMinutes',
        'system',
        'auth',
        'Reset link lifetime',
        'How long a password reset link works.',
        30,
        5,
        120,
        'minutes',
        true,
    ),
    num(
        'auth.passwordResetRequestsPerHour',
        'system',
        'auth',
        'Reset requests per hour',
        'Per account.',
        3,
        1,
        10,
        'requests',
    ),
    num(
        'auth.userSessionDays',
        'system',
        'auth',
        'User session length',
        'Applies to newly issued sessions only.',
        7,
        1,
        30,
        'days',
    ),
    num(
        'auth.adminSessionHours',
        'system',
        'auth',
        'Admin session length',
        'Applies to newly issued sessions only.',
        8,
        1,
        12,
        'hours',
    ),
    num(
        'auth.impersonationMinutes',
        'system',
        'auth',
        'Impersonation length',
        'Applies to new impersonation sessions only.',
        120,
        5,
        120,
        'minutes',
    ),

    // ---------------- SYSTEM: limits ----------------
    num(
        'limits.csvImportMaxRows',
        'system',
        'limits',
        'CSV import: max rows',
        'Rows per import file.',
        5000,
        1,
        50000,
        'rows',
        true,
    ),
    num(
        'limits.csvImportMaxBytes',
        'system',
        'limits',
        'CSV import: max size',
        'File size in bytes (5242880 = 5 MB).',
        5242880,
        65536,
        20971520,
        'bytes',
        true,
    ),
    num(
        'limits.csvExportMaxRows',
        'system',
        'limits',
        'CSV export: max rows',
        'Rows per export (transactions and reports).',
        50000,
        100,
        250000,
        'rows',
    ),
    num(
        'limits.listMaxPageSize',
        'system',
        'limits',
        'Max list page size',
        'Largest page size the API will return.',
        100,
        10,
        500,
        'rows',
        true,
    ),
    num(
        'limits.reportMaxDays',
        'system',
        'limits',
        'Report: max range',
        'Longest report period.',
        1830,
        30,
        3660,
        'days',
    ),
    num(
        'limits.cashflowMaxMonths',
        'system',
        'limits',
        'Cashflow chart: max months',
        'Longest cashflow range.',
        60,
        6,
        120,
        'months',
    ),
    num(
        'limits.balanceTrendMaxDays',
        'system',
        'limits',
        'Balance trend: max days',
        'Longest balance trend range.',
        730,
        30,
        1830,
        'days',
    ),
    num(
        'limits.recurringCatchupPerRun',
        'system',
        'limits',
        'Recurring catch-up per run',
        'Max missed occurrences created per schedule per cron run.',
        24,
        1,
        100,
        'occurrences',
    ),
    num(
        'limits.workspaceNameMinLength',
        'system',
        'limits',
        'Workspace name: min length',
        'Minimum characters for workspace name.',
        2,
        1,
        10,
        'characters',
        true,
    ),
    num(
        'limits.workspaceNameMaxLength',
        'system',
        'limits',
        'Workspace name: max length',
        'Maximum characters for workspace name.',
        60,
        10,
        100,
        'characters',
        true,
    ),

    // ---------------- SYSTEM: features ----------------
    bool(
        'features.invitationsEnabled',
        'system',
        'features',
        'Workspace invitations',
        'When off, creating or resending invitations is blocked.',
        true,
        true,
    ),
    bool(
        'features.csvImportEnabled',
        'system',
        'features',
        'CSV import',
        'When off, the import API is blocked.',
        true,
        true,
    ),
    bool(
        'features.csvExportEnabled',
        'system',
        'features',
        'CSV export',
        'When off, the export API is blocked.',
        true,
        true,
    ),
    bool(
        'features.tourEnabled',
        'system',
        'features',
        'Guided tour',
        'Show the onboarding tour to users.',
        true,
        true,
    ),

    // ---------------- SYSTEM: defaults & UI ----------------
    num(
        'invitations.expiryHours',
        'system',
        'defaults',
        'Invitation lifetime',
        'Applies to newly created invitations.',
        48,
        1,
        720,
        'hours',
    ),
    str(
        'workspace.defaultAccountName',
        'system',
        'defaults',
        'Default account name',
        'Name of the account created with a new workspace.',
        'General',
        100,
        { minLength: 1 },
    ),
    str(
        'workspace.defaultWorkspaceName',
        'system',
        'defaults',
        'Default workspace name',
        'Name of the workspace created for new users.',
        'Personal',
        100,
        { minLength: 1 },
    ),
    num(
        'ui.toastDurationMs',
        'system',
        'defaults',
        'Toast duration',
        'How long notifications stay visible.',
        4000,
        1000,
        15000,
        'ms',
        true,
    ),
    num(
        'ui.toastLimit',
        'system',
        'defaults',
        'Max toasts on screen',
        'Extra toasts queue.',
        4,
        1,
        10,
        'toasts',
        true,
    ),
    num(
        'ui.defaultPageSize',
        'system',
        'defaults',
        'Default page size',
        'Default number of rows per page in tables.',
        20,
        5,
        100,
        'rows',
        true,
    ),
    num(
        'ui.searchDebounceMs',
        'system',
        'defaults',
        'Search debounce',
        'Delay before search queries run.',
        400,
        0,
        1500,
        'ms',
        true,
    ),
    bool(
        'ui.sidebarCollapsedByDefault',
        'system',
        'defaults',
        'Sidebar collapsed by default',
        'Whether the sidebar starts collapsed.',
        false,
        true,
    ),

    // ---------------- WORKSPACE ----------------
    opt(
        'finance.fiscalYearStartMonth',
        'workspace',
        'finance',
        'Fiscal year starts in',
        'Used by "This year" in reports.',
        1,
        MONTHS,
    ),
    num(
        'finance.budgetWarningPercent',
        'workspace',
        'finance',
        'Budget warning at',
        'Budgets turn amber at this % used.',
        80,
        1,
        99,
        '%',
    ),
    num(
        'finance.budgetExceededPercent',
        'workspace',
        'finance',
        'Budget exceeded above',
        'Budgets turn red above this % used.',
        100,
        100,
        200,
        '%',
    ),

    // ---------------- USER ----------------
    // NOTE: verify these option values match your real preset / range ids.
    opt(
        'defaultReportPreset',
        'user',
        'preferences',
        'Default report period',
        'Period selected when you open Reports.',
        'this_month',
        [
            { value: 'this_month', label: 'This month' },
            { value: 'last_month', label: 'Last month' },
            { value: 'this_quarter', label: 'This quarter' },
            { value: 'this_year', label: 'This year' },
            { value: 'last_6_months', label: 'Last 6 months' },
            { value: 'last_12_months', label: 'Last 12 months' },
        ],
    ),
    opt('theme', 'user', 'preferences', 'Theme', 'Color theme used by the dashboard.', 'system', [
        { value: 'system', label: 'System' },
        ...THEMES.map((value) => ({ value, label: value })),
    ]),
    opt(
        'cashflowMonths',
        'user',
        'preferences',
        'Cashflow chart range',
        'Months shown on the dashboard.',
        6,
        [3, 6, 12, 24].map((v) => ({ value: v, label: `${v} months` })),
    ),
    opt(
        'netWorthMonths',
        'user',
        'preferences',
        'Net worth history range',
        'Months shown in the net worth history chart.',
        6,
        [
            ...[3, 6, 12, 24].map((v) => ({ value: v, label: `${v} months` })),
            { value: 'all', label: 'All time' },
        ],
    ),
    opt(
        'balanceTrendDays',
        'user',
        'preferences',
        'Balance trend range',
        'Days shown on the dashboard.',
        30,
        [7, 30, 90, 180, 365].map((v) => ({ value: v, label: `${v} days` })),
    ),
    opt(
        'categoryPeriod',
        'user',
        'preferences',
        'Category chart period',
        'Period for the spending donut.',
        'all',
        [
            { value: 'all', label: 'All time' },
            { value: 'month', label: 'This month' },
            { value: '30d', label: 'Last 30 days' },
            { value: '90d', label: 'Last 90 days' },
            { value: 'year', label: 'This year' },
        ],
    ),
    opt(
        'tablePageSize',
        'user',
        'preferences',
        'Rows per page',
        'Default page size in tables and the ledger.',
        10,
        [10, 20, 50, 100].map((v) => ({ value: v, label: String(v) })),
    ),
    opt(
        'tableDensity',
        'user',
        'preferences',
        'Table density',
        'Row spacing in tables.',
        'comfortable',
        [
            { value: 'comfortable', label: 'Comfortable' },
            { value: 'compact', label: 'Compact' },
        ],
    ),
    opt(
        'locale',
        'user',
        'preferences',
        'Number & date format',
        'Regional formatting for amounts and dates.',
        'en-IN',
        [
            { value: 'en-IN', label: 'English (India)' },
            { value: 'en-US', label: 'English (US)' },
            { value: 'en-GB', label: 'English (UK)' },
        ],
    ),

    // ---------------- SYSTEM: plans (generated from src/lib/plans/constants.ts) ----------------
    ...PLAN_SETTING_DEFS,
];

export const SETTINGS_BY_KEY: Record<string, SettingDef> = Object.fromEntries(
    SETTINGS.map((d) => [d.key, d]),
);

export const defsFor = (scope: SettingScope) => SETTINGS.filter((d) => d.scope === scope);

export function defaultsFor(scope: SettingScope): Record<string, SettingValue> {
    return Object.fromEntries(defsFor(scope).map((d) => [d.key, d.default]));
}

export function publicDefaults(): Record<string, SettingValue> {
    return Object.fromEntries(SETTINGS.filter((d) => d.public).map((d) => [d.key, d.default]));
}
