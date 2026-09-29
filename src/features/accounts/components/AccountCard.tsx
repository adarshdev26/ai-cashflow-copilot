'use client';

import { memo } from 'react';
import { Landmark, Banknote, CreditCard, Wallet, CircleDollarSign } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { AccountType, AccountWithBalance } from '../types';

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  BANK: 'Bank',
  CASH: 'Cash',
  CREDIT_CARD: 'Credit card',
  WALLET: 'Wallet',
  OTHER: 'Other',
};

const ACCOUNT_TYPE_ICONS = {
  BANK: Landmark,
  CASH: Banknote,
  CREDIT_CARD: CreditCard,
  WALLET: Wallet,
  OTHER: CircleDollarSign,
} as const;

// Swap for your existing currency formatter if you have one.
export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

interface AccountCardProps {
  account: AccountWithBalance;
  canEdit: boolean;
  canManage: boolean;
  busy: boolean;
  onEdit: (account: AccountWithBalance) => void;
  onToggleActive: (account: AccountWithBalance) => void;
  onDelete: (account: AccountWithBalance) => void;
}

export const AccountCard = memo(function AccountCard({
  account,
  canEdit,
  canManage,
  busy,
  onEdit,
  onToggleActive,
  onDelete,
}: AccountCardProps) {
  const Icon = ACCOUNT_TYPE_ICONS[account.type] ?? CircleDollarSign;
  const txCount = account.transactionCount ?? 0; // ASSUMPTION: field name
  const isNegative = account.balance < 0;

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${
        account.isActive ? '' : 'opacity-70'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{account.name}</p>
            <p className="text-xs text-slate-500">{ACCOUNT_TYPE_LABELS[account.type]}</p>
          </div>
        </div>
        {!account.isActive && (
          <span className="shrink-0 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            Inactive
          </span>
        )}
      </div>

      <div className="mt-4">
        <p className="text-xs text-slate-500">Balance</p>
        <p className={`text-2xl font-bold tracking-tight ${isNegative ? 'text-red-600' : 'text-slate-900'}`}>
          {formatMoney(account.balance, account.currency)}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {txCount} {txCount === 1 ? 'transaction' : 'transactions'}
        </p>
      </div>

      {(canEdit || canManage) && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
          {canEdit && (
            <Button variant="secondary" onClick={() => onEdit(account)} disabled={busy}>
              Edit
            </Button>
          )}
          {canManage && (
            <Button variant="secondary" onClick={() => onToggleActive(account)} disabled={busy}>
              {account.isActive ? 'Deactivate' : 'Reactivate'}
            </Button>
          )}
          {canManage && txCount === 0 && (
            <Button variant="secondary" onClick={() => onDelete(account)} disabled={busy}>
              Delete
            </Button>
          )}
        </div>
      )}
    </div>
  );
});