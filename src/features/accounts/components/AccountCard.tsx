'use client';

import { memo } from 'react';
import { Landmark, Banknote, CreditCard, Wallet, CircleDollarSign } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { AccountType, AccountWithBalance } from '../types';
import { useUserLocale } from '@/features/settings/hooks/use-settings';
import { cn } from '@/lib/cn';

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
export function formatMoney(amount: number, currency: string, locale?: string): string {
    try {
        return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
    } catch {
        return `${currency} ${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(amount)}`;
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
    const locale = useUserLocale();
    const Icon = ACCOUNT_TYPE_ICONS[account.type] ?? CircleDollarSign;
    const txCount = account.transactionCount ?? 0;
    const isNegative = account.balance < 0;

    return (
        <div
            className={`border-base-300 bg-base-100 rounded-xl border p-5 shadow-sm ${
                account.isActive ? '' : 'opacity-70'
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                        <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-base-content truncate text-sm font-semibold">
                            {account.name}
                        </p>
                        <p className="text-base-content/60 text-xs">
                            {ACCOUNT_TYPE_LABELS[account.type]}
                        </p>
                        <span
                            className={cn(
                                'mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase',
                                account.classification === 'LIABILITY'
                                    ? 'border-error/30 bg-error/10 text-error'
                                    : 'border-success/30 bg-success/10 text-success',
                            )}
                        >
                            {account.classification === 'LIABILITY' ? 'Liability' : 'Asset'}
                        </span>
                    </div>
                </div>
                {!account.isActive && (
                    <span className="border-base-300 bg-base-200 text-base-content/70 shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium">
                        Inactive
                    </span>
                )}
            </div>

            <div className="mt-4">
                <p className="text-base-content/60 text-xs">Balance</p>
                <p
                    className={`text-2xl font-bold tracking-tight ${isNegative ? 'text-error' : 'text-base-content'}`}
                >
                    {formatMoney(account.balance, account.currency, locale)}
                </p>
                <p className="text-base-content/50 mt-1 text-xs">
                    {txCount} {txCount === 1 ? 'transaction' : 'transactions'}
                </p>
            </div>

            {(canEdit || canManage) && (
                <div className="border-base-200 mt-4 flex flex-wrap gap-2 border-t pt-3">
                    {canEdit && (
                        <Button variant="secondary" onClick={() => onEdit(account)} disabled={busy}>
                            Edit
                        </Button>
                    )}
                    {canManage && (
                        <Button
                            variant="secondary"
                            onClick={() => onToggleActive(account)}
                            disabled={busy}
                        >
                            {account.isActive ? 'Deactivate' : 'Reactivate'}
                        </Button>
                    )}
                    {canManage && txCount === 0 && (
                        <Button
                            variant="secondary"
                            onClick={() => onDelete(account)}
                            disabled={busy}
                        >
                            Delete
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
});
