import {
    Home,
    Briefcase,
    Users,
    UserPlus,
    Layers,
    ReceiptText,
    Sparkles,
    UserCheck,
    LayoutTemplate,
    Search,
    BarChart3,
    Lock,
    Eye,
    KeyRound,
    ShieldCheck,
    Wallet,
} from 'lucide-react';
import type { Feature, FeatureDetail } from './features';

/* ---------- Home / About ---------- */
export const USE_CASES: Feature[] = [
    {
        icon: Home,
        title: 'Households',
        description:
            'Share one workspace with your partner or family so everyone sees the same groceries, bills, and income, without passing a spreadsheet around.',
    },
    {
        icon: Briefcase,
        title: 'Side projects and freelancers',
        description:
            'Keep project income and expenses apart from personal spending, with a clean ledger for each client or project.',
    },
    {
        icon: Users,
        title: 'Small teams',
        description:
            'Give teammates access to a shared workspace and manage who is in it, and who is still pending, from settings.',
    },
];

/* ---------- How it works ---------- */
export const ONBOARDING: Feature[] = [
    {
        icon: UserPlus,
        title: 'Create your account',
        description: 'Sign up and follow the short onboarding flow.',
    },
    {
        icon: Layers,
        title: 'Name your first workspace',
        description:
            'Pick a name that fits, like Family or Studio. You can add more workspaces later.',
    },
    {
        icon: ReceiptText,
        title: 'Add a transaction',
        description: 'Record an income or an expense with the focused entry form.',
    },
    {
        icon: Sparkles,
        title: 'Take the guided tour',
        description:
            'A short walkthrough points out workspaces, transactions, and the main areas of the app.',
    },
    {
        icon: LayoutTemplate,
        title: 'Save a template',
        description:
            'Turn a repeating entry, like rent, into a template for next time (Plus and Team).',
    },
    {
        icon: UserCheck,
        title: 'Invite someone',
        description: 'Send an invitation by email when you are ready to share (Plus and Team).',
    },
];

export const WEEKLY_RHYTHM: Feature[] = [
    {
        icon: ReceiptText,
        title: 'Log as you go',
        description:
            'Add income and expenses the moment they happen, at the counter or later in the evening.',
    },
    {
        icon: Search,
        title: 'Review the ledger',
        description: 'Search, sort, and filter your transactions to see where the week went.',
    },
    {
        icon: BarChart3,
        title: 'Compare the totals',
        description:
            'Income, expenses, and net balance update as you add transactions, so you always know where you stand.',
    },
    {
        icon: Users,
        title: 'Stay in sync',
        description: 'Everyone in a workspace sees the same up-to-date picture.',
    },
];

export const HOW_FAQS = [
    {
        q: 'How do I get started?',
        a: 'Sign up, name your first workspace, and add a transaction. A short guided tour then points out the main areas of the app.',
    },
    {
        q: 'Do I have to invite anyone?',
        a: 'No. A workspace works fine on your own. Invite people only when you want to share it.',
    },
    {
        q: 'Can I add more workspaces later?',
        a: 'Yes. The Free plan includes 1 workspace, Plus allows up to 5, and Team is unlimited.',
    },
    {
        q: 'What if I make a mistake in a transaction?',
        a: 'Transactions live in a searchable ledger, so you can find an entry and correct it whenever you notice.',
    },
    {
        q: 'Where do templates fit in?',
        a: 'Save a repeating entry such as rent or a subscription as a template, then reuse it with a click. Templates are part of Plus and Team.',
    },
];

/* ---------- Security ---------- */
// TODO: verify every claim here matches what you actually ship.
export const SECURITY_DETAILS: FeatureDetail[] = [
    {
        icon: Lock,
        eyebrow: 'Access',
        title: 'Every request is checked before data is shown',
        description:
            'Dashboard requests are checked against a valid session before any workspace data is returned. If you are not signed in, there is nothing to see.',
        bullets: [
            'A valid session is required for dashboard requests',
            'Workspace data is only shown after authentication',
            'Access is evaluated per workspace, not only per account',
            'Signed-out visitors only ever see the public marketing pages',
        ],
    },
    {
        icon: Eye,
        eyebrow: 'Separation',
        title: 'Each workspace is its own space',
        description:
            'Transactions, accounts, members, and totals belong to a workspace and are visible only to its members. Family money and business money never blur together.',
        bullets: [
            'Data belongs to a single workspace',
            'Only members of a workspace can see its contents',
            'Switching workspaces switches the whole picture',
            'Use as many workspaces as your plan allows',
        ],
    },
    {
        icon: UserCheck,
        eyebrow: 'Membership',
        title: 'You decide who gets in',
        description:
            'People join a workspace only through an invitation from an existing member. Review and change access from workspace settings whenever you like.',
        bullets: [
            'Invite people by email',
            'See members and pending invitations in one place',
            'Only invited people can join a workspace',
            'Make changes from settings at any time',
        ],
    },
];

export const INVITE_STEPS = [
    {
        title: 'A member sends an invitation',
        description: 'Enter the person’s email address from the workspace settings.',
    },
    {
        title: 'The person accepts',
        description: 'They join the workspace only after accepting the invitation.',
    },
    {
        title: 'They see that workspace only',
        description:
            'Access is limited to the workspace they were invited to. Your other workspaces stay separate.',
    },
];

export const SECURITY_PRACTICES: Feature[] = [
    {
        icon: KeyRound,
        title: 'Use a unique password',
        description:
            'A password you do not reuse anywhere else is the simplest protection for your account.',
    },
    {
        icon: UserCheck,
        title: 'Invite people you trust',
        description:
            'Anyone you invite to a workspace can see its contents, so share it with the people who should see it.',
    },
    {
        icon: Eye,
        title: 'Review members now and then',
        description:
            'Check the member list and pending invitations in settings and clean up what you no longer need.',
    },
    {
        icon: ShieldCheck,
        title: 'Keep your email secure',
        description:
            'Invitations and account messages go to your email, so protect that account too.',
    },
];

export const SECURITY_FAQS = [
    {
        q: 'Who can see my workspace?',
        a: 'Only its members. People join through an invitation from an existing member.',
    },
    {
        q: 'Is my data mixed with my other workspaces?',
        a: 'No. Each workspace keeps its own transactions, accounts, members, and totals.',
    },
    {
        q: 'Can I remove someone?',
        a: 'You can manage members and pending invitations from workspace settings.',
    },
    {
        q: 'What do I need to be signed in to see?',
        a: 'Every dashboard request is checked against a valid session. Without one, no workspace data is shown.',
    },
    {
        q: 'How do I report a security concern?',
        a: 'Use the contact page and mention security in your message, and we will look into it.',
    },
];

/* ---------- Pricing ---------- */
export const INCLUDED_EVERYWHERE: Feature[] = [
    {
        icon: ReceiptText,
        title: 'Unlimited transactions',
        description: 'Record as many income and expense entries as you need on every plan.',
    },
    {
        icon: Search,
        title: 'Search, sort and paging',
        description: 'Find any entry in a ledger that stays readable as it grows.',
    },
    {
        icon: Sparkles,
        title: 'Guided tour',
        description: 'A short walkthrough shows you around on your first visit.',
    },
];

export const PLAN_FIT: Feature[] = [
    {
        icon: Wallet,
        title: 'Free is for individuals',
        description:
            'Start tracking with one workspace, unlimited transactions, and a ledger that stays clean as it grows.',
    },
    {
        icon: Home,
        title: 'Plus is for families and side projects',
        description:
            'Up to 5 workspaces, invite members by email, and reuse templates for repeating entries.',
    },
    {
        icon: Users,
        title: 'Team is for small teams',
        description:
            'Unlimited workspaces, a larger member limit, and member and invitation management.',
    },
];

/* ---------- About / Contact ---------- */
export const ABOUT_FAQS = [
    {
        q: 'Who is it for?',
        a: 'Individuals, families, and small teams who want a clear, shared view of everyday money without a heavy accounting tool.',
    },
    {
        q: 'Can I try it for free?',
        a: 'Yes. The Free plan includes one workspace and unlimited transactions.',
    },
    {
        q: 'Is it only for shared money?',
        a: 'No. Plenty of people use a single workspace on their own. Sharing is there when you want it.',
    },
    { q: 'How can I share feedback?', a: 'Use the contact page. We read every message.' },
];

export const CONTACT_FAQS = [
    {
        q: 'How do I get help with my account?',
        a: 'Send us a message with the email you signed up with and a short description of what you need.',
    },
    {
        q: 'Can I suggest a feature?',
        a: 'Please do. Ideas and feedback are very welcome through the form on this page.',
    },
    {
        q: 'Where do I report a security concern?',
        a: 'Write to us through this page and mention security, or read how workspaces are protected on the security page.',
    },
    {
        q: 'Where can I read the legal details?',
        a: 'See the privacy policy and terms of service linked in the footer.',
    },
];
