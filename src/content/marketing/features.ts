import {
  Layers, ReceiptText, LayoutTemplate, BarChart3, Target, NotebookPen, Users,
  ShieldCheck, Lock, UserCheck, Eye, Sparkles, Wallet, HeartHandshake,
  type LucideIcon,
} from 'lucide-react';

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
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
};

export const FEATURE_DETAILS: FeatureDetail[] = [
  {
    icon: Layers,
    eyebrow: 'Workspaces',
    title: 'One workspace for every part of your life',
    description:
      'Everything you add lives inside a workspace. Switch between them in a click and keep household spending, business expenses, and side-project income in separate, clearly labeled spaces. Each workspace has its own ledger, members, habits, notes, and totals.',
    bullets: [
      'Create as many workspaces as you need for home, work, projects, or clients',
      'Switch instantly from the top bar without losing your place',
      'Each workspace keeps its own members, transactions, habits, and numbers',
      'Invite only the people who should see that part of your finances',
    ],
  },
  {
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
  },
  {
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
    icon: Users,
    eyebrow: 'Together',
    title: 'Manage money with the people who share it',
    description:
      'Invite family members, partners, or teammates into a workspace and manage access from settings. Everyone sees the same up-to-date picture, while each workspace stays limited to the people you choose.',
    bullets: [
      'Invite people by email in a few steps',
      'Manage members and pending invitations from settings',
      'Only people you invite can see a workspace',
      'Keep shared money organized without shared spreadsheets',
    ],
  },
];

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