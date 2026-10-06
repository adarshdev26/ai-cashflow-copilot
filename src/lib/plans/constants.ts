export const PLAN_IDS = ['FREEMIUM', 'PREMIUM'] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export const PLAN_LABELS: Record<PlanId, string> = { FREEMIUM: 'Free', PREMIUM: 'Premium' };

/** -1 means unlimited. */
export const UNLIMITED = -1;
export const isUnlimited = (limit: number) => limit === UNLIMITED;

/** key -> label. Add a new numeric limit here first. */
export const PLAN_LIMITS = {
    maxWorkspaces: 'Workspaces you own',
    maxCollaborators: 'Collaborators per workspace',
    maxAccounts: 'Accounts',
    maxCustomCategories: 'Custom categories',
    maxBudgets: 'Budgets',
    maxRecurring: 'Recurring transactions',
    maxTemplates: 'Templates',
} as const;

/** key -> label. Add a new on/off feature here first. */
export const PLAN_FEATURES = {
    reports: 'Reports',
    import: 'CSV import',
    export: 'CSV export',
    invitations: 'Workspace invitations',
} as const;

export type PlanLimitKey = keyof typeof PLAN_LIMITS;
export type PlanFeatureKey = keyof typeof PLAN_FEATURES;

export type PlanConfig = {
    limits: Record<PlanLimitKey, number>;
    features: Record<PlanFeatureKey, boolean>;
};

export const PLAN_DEFAULTS: Record<PlanId, PlanConfig> = {
    FREEMIUM: {
        limits: {
            maxWorkspaces: 2,
            maxCollaborators: 1,
            maxAccounts: 3,
            maxCustomCategories: 5,
            maxBudgets: 3,
            maxRecurring: 3,
            maxTemplates: 3,
        },
        features: { reports: false, import: false, export: false, invitations: true },
    },
    PREMIUM: {
        limits: {
            maxWorkspaces: UNLIMITED,
            maxCollaborators: UNLIMITED,
            maxAccounts: UNLIMITED,
            maxCustomCategories: UNLIMITED,
            maxBudgets: UNLIMITED,
            maxRecurring: UNLIMITED,
            maxTemplates: UNLIMITED,
        },
        features: { reports: true, import: true, export: true, invitations: true },
    },
};

export const planSettingKey = (plan: PlanId, key: PlanLimitKey | PlanFeatureKey) =>
    `plans.${plan}.${key}`;
