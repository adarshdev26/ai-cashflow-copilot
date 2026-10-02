import type { DriveStep } from 'driver.js';
import { canWorkspaceAction, type WorkspaceAction, type WorkspaceRole } from '@/features/workspaces/permissions';

export const TOUR_PARAM = 'tour';
export const OVERVIEW_PATH = '/dashboard';
export const FINANCE_PATH = '/dashboard/transactions';

export type TourPhase = 'overview' | 'finance';

const PHASE_PARAM_VALUE: Record<TourPhase, string> = { overview: '1', finance: 'finance' };

export const PHASE_PATH: Record<TourPhase, string> = {
  overview: OVERVIEW_PATH,
  finance: FINANCE_PATH,
};

/** The element we wait for before starting each phase. */
export const PHASE_READY_SELECTOR: Record<TourPhase, string> = {
  overview: '[data-tour="workspace-switcher"]',
  finance: '[data-tour="transaction-table"]',
};

export function parseTourPhase(value: string | null): TourPhase | null {
  if (value === PHASE_PARAM_VALUE.overview) return 'overview';
  if (value === PHASE_PARAM_VALUE.finance) return 'finance';
  return null;
}

/** tourHref('overview') -> '/dashboard?tour=1' */
export function tourHref(phase: TourPhase): string {
  return `${PHASE_PATH[phase]}?${TOUR_PARAM}=${PHASE_PARAM_VALUE[phase]}`;
}

type Actions = { goToFinance: () => void };
type TourStep = DriveStep & { requires?: WorkspaceAction };

const overviewSteps = (actions: Actions): TourStep[] => [
  {
    element: '[data-tour="workspace-switcher"]',
    popover: {
      title: 'Your workspace',
      description:
        'Everything you add lives in a workspace. If you have more than one, switch between them here.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="new-workspace-btn"]',
    popover: {
      title: 'Create more workspaces',
      description: 'Keep family, business or side-project money separate with its own workspace.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="workspace-role"]',
    popover: {
      title: 'Your workspace role',
      description: 'Your role controls which workspace actions are available.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="account-switcher"]',
    popover: {
      title: 'Filter by account',
      description: 'Choose an account to filter the Transactions ledger.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="theme-switcher"]',
    popover: {
      title: 'Choose a theme',
      description: 'Pick a color theme for the app.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '[data-tour="signed-in-user"]',
    popover: {
      title: 'Signed-in account',
      description: 'Your name and email identify the account currently signed in.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour="sign-out"]',
    popover: {
      title: 'Sign out',
      description: 'End your current session from here.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour="take-tour"]',
    popover: {
      title: 'Take a tour',
      description: 'Start the guided overview from this button.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '[data-tour="finance-stats"]',
    popover: {
      title: 'Your numbers',
      description:
        'Income, expenses and net balance for this workspace show up here as you add transactions.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="overview-cashflow"]',
    popover: {
      title: 'Cash flow chart',
      description: 'Compare income and expenses across the selected months.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour="overview-category-breakdown"]',
    popover: {
      title: 'Category breakdown',
      description: 'See how expenses are divided across categories.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour="overview-balance-trend"]',
    popover: {
      title: 'Balance trend',
      description: 'Follow your running balance over time.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour="overview-cashflow-png"]',
    popover: {
      title: 'Download chart image',
      description: 'Save the cash flow chart as a PNG image.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '[data-tour="overview-category-png"]',
    popover: {
      title: 'Download category chart',
      description: 'Save the category breakdown as a PNG image.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '[data-tour="overview-balance-png"]',
    popover: {
      title: 'Download balance chart',
      description: 'Save the balance trend as a PNG image.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '[data-tour="nav-transactions"]',
    popover: {
      title: 'Transactions',
      description: "Let's see where you add your transactions.",
      side: 'right',
      align: 'start',
      // Last visible step of this phase, so the button shows the "done" label.
      nextBtnText: 'Open Transactions',
      doneBtnText: 'Open Transactions',
      onNextClick: () => actions.goToFinance(),
    },
  },
];

const financeSteps: TourStep[] = [
  {
    element: '[data-tour="add-transaction-btn"]',
    popover: {
      title: 'Add a transaction',
      description: 'Start here: record an income or an expense. Try something you spent today.',
      side: 'bottom',
      align: 'end',
    },
    requires: 'transaction.create',
  },
  {
    element: '[aria-label="Save as template"]',
    popover: {
      title: 'Save as template',
      description: 'Turn any transaction into a reusable template for quick entry later.',
      side: 'left',
      align: 'start',
    },
    requires: 'templates.manage',
  },
  {
    element: '[data-tour="transaction-table"]',
    popover: {
      title: 'Your ledger',
      description: 'Every transaction appears here. You can search, sort and page through them.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour="transactions-import-export"]',
    popover: {
      title: 'Import and export',
      description: 'Move transaction records in or out with CSV files.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '[data-tour="transactions-import"]',
    popover: {
      title: 'Import a CSV',
      description: 'Import transactions from a CSV file when you can create transactions.',
      side: 'bottom',
      align: 'end',
    },
    requires: 'transaction.create',
  },
  {
    element: '[data-tour="use-template-btn"]',
    popover: {
      title: 'Use a template',
      description: 'Start a transaction from a saved template.',
      side: 'bottom',
      align: 'end',
    },
    requires: 'transaction.create',
  },
  {
    element: '[data-tour="transaction-filters"]',
    popover: {
      title: 'Filter transactions',
      description: 'Narrow the ledger by type, account, category, or date.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="transaction-search"]',
    popover: {
      title: 'Search transactions',
      description: 'Find ledger entries by their description.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="transaction-actions"]',
    popover: {
      title: 'Edit or delete entries',
      description: 'Available row actions let you edit or delete transactions.',
      side: 'top',
      align: 'end',
    },
    requires: 'transaction.update',
  },
  {
    element: '[data-tour="transaction-pagination"]',
    popover: {
      title: 'Ledger pagination',
      description: 'Choose how many entries to show and move between pages.',
      side: 'top',
      align: 'end',
    },
  },
  {
    element: '[data-tour="nav-settings"]',
    popover: {
      title: 'Settings',
      description: 'Manage your workspace, members and invitations.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="recurring-add-btn"]',
    popover: {
      title: 'Add recurring transactions',
      description: 'Schedule income or expenses to be recorded automatically.',
      side: 'bottom',
      align: 'end',
    },
    requires: 'recurring.manage',
  },
  {
    element: '[data-tour="recurring-list"]',
    popover: {
      title: 'Recurring schedules',
      description: 'Review the frequency and next run for each scheduled transaction.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour="recurring-actions"]',
    popover: {
      title: 'Manage schedules',
      description: 'Pause, resume, or edit recurring schedules from their row actions.',
      side: 'top',
      align: 'end',
    },
    requires: 'recurring.manage',
  },
  {
    element: '[data-tour="templates-add-btn"]',
    popover: {
      title: 'Add a template',
      description: 'Save a reusable transaction for quick entry later.',
      side: 'bottom',
      align: 'end',
    },
    requires: 'templates.manage',
  },
  {
    element: '[data-tour="templates-list"]',
    popover: {
      title: 'Your templates',
      description: 'Review reusable entries, including fixed dates and dates set at use.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour="budgets-add-btn"]',
    popover: {
      title: 'Create a budget',
      description: 'Set a monthly spending limit for a category.',
      side: 'bottom',
      align: 'end',
    },
    requires: 'budgets.manage',
  },
  {
    element: '[data-tour="budgets-list"]',
    popover: {
      title: 'Your budgets',
      description: 'Compare spending progress with each category’s monthly limit.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour="budgets-month-selector"]',
    popover: {
      title: 'Choose a budget month',
      description: 'Move between months to review their budgets and spending.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="accounts-add-btn"]',
    popover: {
      title: 'Add an account',
      description: 'Track balances across your bank accounts, cards and wallets.',
      side: 'bottom',
      align: 'end',
    },
    requires: 'account.create',
  },
  {
    element: '[data-tour="accounts-list"]',
    popover: {
      title: 'Your accounts',
      description: 'Compare balances and review accounts in this workspace.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour="categories-add-btn"]',
    popover: {
      title: 'Add a category',
      description: 'Create a custom category to organize transactions.',
      side: 'bottom',
      align: 'end',
    },
    requires: 'category.create',
  },
  {
    element: '[data-tour="categories-list"]',
    popover: {
      title: 'Your categories',
      description: 'Review workspace-specific categories and their status.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour="categories-actions"]',
    popover: {
      title: 'Manage custom categories',
      description: 'Edit, activate, or delete custom categories from this list.',
      side: 'top',
      align: 'end',
    },
    requires: 'category.update',
  },
  {
    element: '[data-tour="categories-defaults"]',
    popover: {
      title: 'Shared categories',
      description: 'Use the shared defaults or create workspace-specific categories.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour="reports-filters"]',
    popover: {
      title: 'Report filters',
      description: 'Choose a date range, account, category or transaction type.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="reports-export"]',
    popover: {
      title: 'Export your report',
      description: 'Download the filtered report as a CSV file.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '[data-tour="reports-summary"]',
    popover: {
      title: 'Report summary',
      description: 'Review income, expenses, net cash flow and savings rate.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="reports-income-expense"]',
    popover: {
      title: 'Income vs expense',
      description: 'Compare income and expenses across the selected period.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour="reports-category-chart"]',
    popover: {
      title: 'Spending by category',
      description: 'See how spending is distributed across categories.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour="reports-budget-performance"]',
    popover: {
      title: 'Budget performance',
      description: 'Compare budget limits with spending for each category.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour="reports-top-expenses"]',
    popover: {
      title: 'Top expenses',
      description: 'Review the largest expenses in the selected report period.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour="reports-account-breakdown"]',
    popover: {
      title: 'Account breakdown',
      description: 'Compare income, expenses, and net totals by account.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour="reports-income-png"]',
    popover: {
      title: 'Download income chart',
      description: 'Save the income and expense chart as a PNG image.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '[data-tour="reports-category-png"]',
    popover: {
      title: 'Download category chart',
      description: 'Save the category spending chart as a PNG image.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '[data-tour="settings-tabs"]',
    popover: {
      title: 'Settings tabs',
      description: 'Switch between your profile and workspace settings.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="settings-profile"]',
    popover: {
      title: 'Profile settings',
      description: 'Update your name and change your password here.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour="settings-workspace-general"]',
    popover: {
      title: 'Workspace details',
      description: 'View the name and details for this workspace.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour="settings-workspace-rename"]',
    popover: {
      title: 'Rename workspace',
      description: 'Update the workspace name when your role permits it.',
      side: 'top',
      align: 'start',
    },
    requires: 'workspace.rename',
  },
  {
    element: '[data-tour="settings-members"]',
    popover: {
      title: 'Workspace members',
      description: 'View members, change roles, or remove them when permitted.',
      side: 'top',
      align: 'start',
    },
    requires: 'members.view',
  },
  {
    element: '[data-tour="settings-invitations"]',
    popover: {
      title: 'Pending invitations',
      description: 'Review invitations waiting to be accepted.',
      side: 'top',
      align: 'start',
    },
    requires: 'members.invite',
  },
  {
    element: '[data-tour="settings-invite-form"]',
    popover: {
      title: 'Invite a member',
      description: 'Send an invitation by email and choose the member’s role.',
      side: 'top',
      align: 'start',
    },
    requires: 'members.invite',
  },
  {
    element: '[data-tour="settings-role-permissions"]',
    popover: {
      title: 'Role permissions',
      description: 'Compare access levels and see which actions your role allows.',
      side: 'top',
      align: 'start',
    },
  },
];

function isOnScreen(selector: string): boolean {
  try {
    const el = document.querySelector(selector);
    if (!el) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse') return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.right > 0 && rect.left < window.innerWidth;
  } catch {
    return false;
  }
}

/** Skip absent, hidden, or off-canvas targets; the driver can scroll vertically to visible content. */
export function buildTourSteps(
  phase: TourPhase,
  actions: Actions,
  role: WorkspaceRole | null | undefined
): DriveStep[] {
  const all = phase === 'overview' ? overviewSteps(actions) : financeSteps;
  return all.filter(
    (step) =>
      (!step.requires || canWorkspaceAction(role, step.requires)) &&
      typeof step.element === 'string' &&
      isOnScreen(step.element)
  );
}

/** Resolves true once the element exists (plus a short settle delay), false on timeout. */
export function waitForElement(selector: string, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      let found = false;
      try {
        found = !!document.querySelector(selector);
      } catch {
        resolve(false);
        return;
      }
      if (found) {
        setTimeout(() => resolve(true), 250); // let layout settle
        return;
      }
      if (Date.now() - start > timeoutMs) {
        resolve(false);
        return;
      }
      setTimeout(tick, 150);
    };
    tick();
  });
}
