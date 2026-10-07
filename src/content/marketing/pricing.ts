export type Plan = {
    id: string;
    name: string;
    description: string;
    priceMonthly: number | null; // null = custom / contact us
    priceAnnual: number | null; // per month, billed yearly
    currency: string;
    cta: { label: string; href: string };
    features: string[];
    highlighted?: boolean;
    badge?: string;
};

// TODO: replace names, prices and limits with your real plans.
export const plans: Plan[] = [
    {
        id: 'free',
        name: 'Free',
        description: 'For individuals getting started with tracking.',
        priceMonthly: 0,
        priceAnnual: 0,
        currency: '$',
        cta: { label: 'Get started free', href: '/signup' },
        features: [
            '1 workspace',
            'Unlimited transactions',
            'Transaction search and sorting',
            'Guided tour',
        ],
    },
    {
        id: 'plus',
        name: 'Plus',
        description: 'For families and side projects that share money.',
        priceMonthly: 9,
        priceAnnual: 7,
        currency: '$',
        cta: { label: 'Start with Plus', href: '/signup' },
        highlighted: true,
        badge: 'Most popular',
        features: [
            'Up to 5 workspaces',
            'Invite members by email',
            'Reusable transaction templates',
            'Everything in Free',
        ],
    },
    {
        id: 'team',
        name: 'Team',
        description: 'For small teams that manage money together.',
        priceMonthly: 24,
        priceAnnual: 19,
        currency: '$',
        cta: { label: 'Start with Team', href: '/signup' },
        features: [
            'Unlimited workspaces',
            'Larger member limit',
            'Member and invitation management',
            'Everything in Plus',
        ],
    },
];

export type ComparisonValue = boolean | string;

export type ComparisonRow = {
    feature: string;
    group?: string;
    values: Record<string, ComparisonValue>; // keyed by Plan.id
};

// TODO: keep in sync with `plans` above.
export const comparisonRows: ComparisonRow[] = [
    {
        group: 'Workspaces',
        feature: 'Workspaces',
        values: { free: '1', plus: 'Up to 5', team: 'Unlimited' },
    },
    {
        group: 'Workspaces',
        feature: 'Invite members',
        values: { free: false, plus: true, team: true },
    },
    {
        group: 'Workspaces',
        feature: 'Manage members and invitations',
        values: { free: false, plus: true, team: true },
    },
    {
        group: 'Transactions',
        feature: 'Income and expense tracking',
        values: { free: true, plus: true, team: true },
    },
    {
        group: 'Transactions',
        feature: 'Search, sort and paging',
        values: { free: true, plus: true, team: true },
    },
    {
        group: 'Transactions',
        feature: 'Reusable templates',
        values: { free: false, plus: true, team: true },
    },
    { group: 'Extras', feature: 'Guided tour', values: { free: true, plus: true, team: true } },
];
