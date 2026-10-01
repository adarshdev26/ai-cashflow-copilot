import type { DriveStep } from 'driver.js';

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

const overviewSteps = (actions: Actions): DriveStep[] => [
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

const financeSteps: DriveStep[] = [
  {
    element: '[data-tour="add-transaction-btn"]',
    popover: {
      title: 'Add a transaction',
      description: 'Start here: record an income or an expense. Try something you spent today.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '[aria-label="Save as template"]',
    popover: {
      title: 'Save as template',
      description: 'Turn any transaction into a reusable template for quick entry later.',
      side: 'left',
      align: 'start',
    },
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
    element: '[data-tour="nav-habits"]',
    popover: {
      title: 'Habits',
      description: 'Track the daily habits that support your money goals.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="nav-notes"]',
    popover: {
      title: 'Notes',
      description: 'Keep quick notes next to your numbers.',
      side: 'right',
      align: 'start',
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
];

function isOnScreen(selector: string): boolean {
  const el = document.querySelector(selector);
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return (
    r.width > 0 &&
    r.height > 0 &&
    r.right > 0 &&
    r.left < window.innerWidth &&
    r.bottom > 0 &&
    r.top < window.innerHeight
  );
}

/** Only steps whose target is visible right now (mobile drawer, roles, missing widgets). */
export function buildTourSteps(phase: TourPhase, actions: Actions): DriveStep[] {
  const all = phase === 'overview' ? overviewSteps(actions) : financeSteps;
  return all.filter((s) => typeof s.element === 'string' && isOnScreen(s.element));
}

/** Resolves true once the element exists (plus a short settle delay), false on timeout. */
export function waitForElement(selector: string, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      if (document.querySelector(selector)) {
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