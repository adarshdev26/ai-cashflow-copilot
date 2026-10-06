import {
    Layers,
    ReceiptText,
    LayoutTemplate,
    BarChart3,
    Target,
    NotebookPen,
    Users,
    ShieldCheck,
    Lock,
    UserCheck,
    Eye,
    Sparkles,
    Wallet,
    HeartHandshake,
    Landmark,
    Repeat,
    PiggyBank,
    Tags,
    type LucideIcon,
} from 'lucide-react';
import type { Shot } from '@/components/marketing/primitives/BrowserFrame';

export type Feature = { icon: LucideIcon; title: string; description: string };

export const FEATURES: Feature[] = [
    {
        icon: Layers,
        title: 'Separate workspaces',
        description:
            'Keep family, business, and side-project money completely apart. Every workspace has its own transactions, members, habits, notes, and totals, so one part of your life never blurs into another.',
    },
    {
        icon: ReceiptText,
        title: 'Fast transactions',
        description:
            'Record income and expenses in seconds, whether you are at the counter or catching up later. Search, sort, filter, and page through your full ledger without losing the details that matter.',
    },
    {
        icon: LayoutTemplate,
        title: 'Reusable templates',
        description:
            'Turn any transaction into a reusable template for rent, subscriptions, invoices, or any entry you make again and again. Next time, it takes a click instead of a full form.',
    },
    {
        icon: BarChart3,
        title: 'Clear numbers',
        description:
            'See income, expenses, and net balance for each workspace in a layout that is easy to scan. Your numbers update as you add transactions, so you always know where you stand.',
    },
    {
        icon: Target,
        title: 'Money habits',
        description:
            'Track the daily habits that support your money goals, from saving and budgeting to checking in on spending. Keep those routines right next to the finances they are meant to improve.',
    },
    {
        icon: NotebookPen,
        title: 'Notes beside numbers',
        description:
            'Capture quick notes, reminders, and context without leaving your workspace. Add the story behind a transaction or a decision while it is still fresh.',
    },
];

export type FeatureDetail = {
    id?: string;
    icon: LucideIcon;
    eyebrow: string;
    title: string;
    description: string;
    bullets: string[];
    image?: Shot;
};

// TODO: verify every claim here matches what you actually ship.
export const FEATURE_DETAILS: FeatureDetail[] = [
    {
        id: 'workspaces',
        icon: Layers,
        eyebrow: 'Workspaces',
        title: 'One workspace for every part of your life',
        description:
            'Everything you add lives inside a workspace. Switch between them in a click and keep household spending, business expenses, and side-project income in separate, clearly labeled spaces. Each workspace has its own accounts, ledger, budgets, categories, members, habits, notes, and totals.',
        bullets: [
            'Create as many workspaces as your plan allows for home, work, projects, or clients',
            'Switch instantly from the top bar without losing your place',
            'Each workspace keeps its own accounts, members, transactions, and numbers',
            'Invite only the people who should see that part of your finances',
        ],
        // image: { src: '/marketing/workspaces-light.png', srcDark: '/marketing/workspaces-dark.png', alt: 'Workspaces' },
    },
    {
        id: 'accounts',
        icon: Landmark,
        eyebrow: 'Accounts',
        title: 'Every account, side by side in one workspace',
        description:
            'Add the accounts you actually use, such as cash, a bank account, or a card, and keep them together in a single workspace. Record each transaction against the account it belongs to, so your numbers match what is really happening.',
        bullets: [
            'Add multiple financial accounts inside the same workspace',
            'Record each transaction against the right account',
            'See the full picture across accounts without switching apps',
            'Keep personal and business accounts in separate workspaces',
        ],
        image: {
            src: '/marketing/accounts-light.png',
            srcDark: '/marketing/accounts-light.png',
            alt: 'Accounts',
        },
    },
    {
        id: 'transactions',
        icon: ReceiptText,
        eyebrow: 'Transactions',
        title: 'A ledger that is quick to fill and easy to read',
        description:
            'Add income or expenses the moment they happen, then let the ledger do the organizing. Your entries stay searchable, sortable, and paginated as they grow, so a busy month never turns into a messy spreadsheet.',
        bullets: [
            'Add income and expenses in seconds with a focused entry form',
            'Search, sort, filter, and page through every transaction',
            'Save any transaction as a template for next time',
            'Keep a clean history you can revisit when you need detail',
        ],
        image: {
            src: '/marketing/transactions-light.png',
            srcDark: '/marketing/transactions-light.png',
            alt: 'Transactions',
        },
    },
    {
        id: 'templates',
        icon: LayoutTemplate,
        eyebrow: 'Templates',
        title: 'Turn any entry into a one-click template',
        description:
            'Rent, subscriptions, invoices, the weekly shop: if you enter it again and again, save it once. Next time, pick the template and the form is filled in for you.',
        bullets: [
            'Save any transaction as a reusable template',
            'Create, edit, and delete templates whenever you like',
            'Choose a fixed date or use the date you add the entry',
            'Cut a full form down to a single click',
        ],
        image: {
            src: '/marketing/templates-light.png',
            srcDark: '/marketing/templates-light.png',
            alt: 'Templates',
        },
    },
    {
        id: 'recurring',
        icon: Repeat,
        eyebrow: 'Recurring',
        title: 'Set it once and let it repeat',
        description:
            'Salary, rent, and subscriptions come around on a schedule, so your ledger can keep up on its own. Set up a recurring transaction once and stop re-entering the same numbers every month.',
        bullets: [
            'Schedule income and expenses that repeat automatically',
            'Keep your ledger complete even on busy weeks',
            'Review and manage all recurring entries in one place',
            'Pair them with templates so setup takes seconds',
        ],
        image: {
            src: '/marketing/recurring-light.png',
            srcDark: '/marketing/recurring-light.png',
            alt: 'Recurring',
        },
    },
    {
        id: 'categories',
        icon: Tags,
        eyebrow: 'Categories',
        title: 'Categories that match how you actually spend',
        description:
            'Create your own categories for each workspace instead of squeezing life into a fixed list. Groceries and school fees for the family, software and travel for the business, all labeled the way you think about them.',
        bullets: [
            'Create custom categories for every transaction',
            'Keep a separate set of categories in each workspace',
            'Rename and reorganize as your needs change',
            'Filter and review your ledger by category',
        ],
        image: {
            src: '/marketing/categories-light.png',
            srcDark: '/marketing/categories-light.png',
            alt: 'Categories',
        },
    },
    {
        id: 'budgets',
        icon: PiggyBank,
        eyebrow: 'Budgets',
        title: 'Budgets that follow your real spending',
        description:
            'Set a monthly budget and watch it fill up as you add transactions. Progress is worked out from the entries already in your ledger, so there is nothing extra to maintain.',
        bullets: [
            'Set monthly budgets for the categories that matter',
            'See spent versus remaining, calculated from your transactions',
            'Keep a separate set of budgets in each workspace',
            'Spot overspending early instead of at month end',
        ],
        image: {
            src: '/marketing/budgets-light.png',
            srcDark: '/marketing/budgets-light.png',
            alt: 'Budgets',
        },
    },
    {
        id: 'habits',
        icon: Target,
        eyebrow: 'Habits & notes',
        title: 'Build the habits behind the numbers',
        description:
            'Good money outcomes usually come from small daily routines. Track habits and keep notes in the same place as your transactions, so the behavior behind the numbers is never separated from the numbers themselves.',
        bullets: [
            'Track daily habits that support your money goals',
            'Keep quick notes next to your finances and transactions',
            'Review progress without juggling a separate app',
            'Build context around decisions while they are still fresh',
        ],
    },
    {
        id: 'together',
        icon: Users,
        eyebrow: 'Together',
        title: 'Manage money with the people who share it',
        description:
            'Invite family members, partners, or teammates into a workspace and manage access from settings. Everyone sees the same up-to-date picture, while each workspace stays limited to the people you choose.',
        bullets: [
            'Invite multiple people into the same workspace by email',
            'Manage members and pending invitations from settings',
            'Only people you invite can see a workspace',
            'Keep shared money organized without shared spreadsheets',
        ],
    },
];

/** Pick details by id, in the order you list them. Unknown ids are ignored. */
export function pickDetails(ids: string[]): FeatureDetail[] {
    return ids.flatMap((id) => FEATURE_DETAILS.find((d) => d.id === id) ?? []);
}

export const EXTRAS: Feature[] = [
    {
        icon: Wallet,
        title: 'Net balance at a glance',
        description:
            'See where you stand at a glance, without building or maintaining a spreadsheet.',
    },
    {
        icon: Sparkles,
        title: 'Guided tour',
        description:
            'A short walkthrough shows you around workspaces, transactions, habits, and notes on your first visit.',
    },
    {
        icon: HeartHandshake,
        title: 'Built for sharing',
        description:
            'Designed for households, partners, and small teams who need a shared view of the same numbers.',
    },
];

export const STEPS = [
    {
        title: 'Create your account and first workspace',
        description:
            'Sign up and follow a short onboarding flow that sets up your first workspace. You can add more workspaces later for family, business, or side projects.',
    },
    {
        title: 'Add your transactions',
        description:
            'Record income and expenses as they happen, and save the repeating ones as templates so routine entries take only a click.',
    },
    {
        title: 'Watch your numbers take shape',
        description:
            'Income, expenses, and net balance update as you go, giving you a clear view of each workspace without manual calculations.',
    },
    {
        title: 'Invite people and build habits',
        description:
            'Bring in family members or teammates, then track the daily habits and notes that keep everyone aligned and on course.',
    },
];

// TODO: verify every claim here matches what you actually ship.
export const SECURITY_POINTS: Feature[] = [
    {
        icon: Lock,
        title: 'Authenticated access',
        description:
            'Every dashboard request is checked against a valid session before any workspace data is shown.',
    },
    {
        icon: UserCheck,
        title: 'Invite-only workspaces',
        description:
            'People join a workspace only through an invitation from an existing member, so access stays intentional.',
    },
    {
        icon: Eye,
        title: 'Workspace separation',
        description:
            'Data belongs to a workspace and is only visible to its members, keeping separate parts of your life separate.',
    },
    {
        icon: ShieldCheck,
        title: 'You stay in control',
        description:
            'Manage members, invitations, and workspace access from settings whenever you need to make a change.',
    },
];

export const VALUES: Feature[] = [
    {
        icon: Sparkles,
        title: 'Simple first',
        description:
            'Clear, focused tools you can use on day one, without a finance degree or a complicated setup.',
    },
    {
        icon: HeartHandshake,
        title: 'Better together',
        description:
            'Money is rarely a solo activity, so sharing, inviting, and collaborating are built into the core experience.',
    },
    {
        icon: ShieldCheck,
        title: 'Respect for your data',
        description:
            'Your finances are yours. We aim to handle them with care, transparency, and minimal fuss.',
    },
];

export const FAQS = [
    {
        q: 'What can I track?',
        a: 'You can track income and expenses as transactions, plus daily habits and notes, all inside a workspace. Each workspace keeps its own records so you can separate different parts of your life.',
    },
    {
        q: 'What is a workspace?',
        a: 'A workspace is a separate space with its own transactions, members, habits, notes, and totals. Use one for family, another for a business, another for a side project, or however you want to organize your money.',
    },
    {
        q: 'Can I share a workspace?',
        a: 'Yes. You can invite people by email and manage members and pending invitations from workspace settings. Only people you invite can see that workspace.',
    },
    {
        q: 'What are templates?',
        a: 'Templates are reusable transactions. Save any entry as a template so repeating expenses, like rent or subscriptions, take a click instead of filling out the same form again.',
    },
    {
        q: 'Is there a tour?',
        a: 'Yes. A short guided tour walks you through workspaces, transactions, habits, notes, and the main areas of the app on your first visit.',
    },
];
