import type { RecurringFrequency } from '@/lib/recurring/recurring-dates';
export type { RecurringFrequency };

export type TxType = 'CREDIT' | 'DEBIT';

export interface RecurringTransactionDTO {
  id: string;
  workspaceId: string;
  accountId: string;
  account: { id: string; name: string };
  categoryId: string | null;
  description: string | null;
  amount: number;
  type: TxType;
  frequency: RecurringFrequency;
  startDate: string;
  endDate: string | null;
  nextRunAt: string;
  lastRunAt: string | null;
  lastError: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringInput {
  accountId: string;
  categoryId: string | null;
  description?: string | null;
  amount: number;
  type: TxType;
  frequency: RecurringFrequency;
  startDate: string; // YYYY-MM-DD
  endDate?: string | null;
}

export type RecurringPatch = Partial<RecurringInput> & { isActive?: boolean };

export type RecurringStatus = 'ACTIVE' | 'PAUSED' | 'ENDED';

/** Paused vs ended is derived: an inactive schedule whose next run is past endDate has ended. */
export function getRecurringStatus(r: RecurringTransactionDTO): RecurringStatus {
  if (r.isActive) return 'ACTIVE';
  if (r.endDate && new Date(r.nextRunAt) > new Date(r.endDate)) return 'ENDED';
  return 'PAUSED';
}

/** Per-month equivalent for stat cards. */
export function monthlyEquivalent(r: Pick<RecurringTransactionDTO, 'amount' | 'frequency'>): number {
  if (r.frequency === 'WEEKLY') return (r.amount * 52) / 12;
  if (r.frequency === 'YEARLY') return r.amount / 12;
  return r.amount;
}