'use client';

import { Landmark } from 'lucide-react';
import { useActiveWorkspaceId } from '@/features/workspaces';
import { useAccounts } from '../hooks/use-accounts';
import { useActiveAccountId } from '../lib/active-account';
import { formatMoney } from './AccountCard';

export function ActiveAccountSwitcher() {
  const workspaceId = useActiveWorkspaceId();
  const { data: accounts, isLoading } = useAccounts(workspaceId);
  const [activeAccountId, setActiveAccountId] = useActiveAccountId();
  const selected = accounts?.find((a) => a.id === activeAccountId);

  return (
    <div className="flex items-center gap-2" data-tour={accounts?.length ? 'account-switcher' : undefined}>
      <Landmark className="h-4 w-4 shrink-0 text-base-content/50" />
      <select
        className="cursor-pointer border-none bg-transparent p-0 text-sm font-semibold text-base-content/80 focus:ring-0"
        value={activeAccountId ?? ''}
        onChange={(e) => setActiveAccountId(e.target.value || null)}
        disabled={isLoading}
        aria-label="Select account"
      >
        <option value="">All accounts</option>
        {accounts?.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}{a.isActive ? '' : ' (inactive)'}
          </option>
        ))}
      </select>
      {selected && (
        <span
          className={`hidden rounded-full border px-2 py-0.5 text-xs font-medium lg:inline ${
            selected.balance < 0
              ? 'border-error/30 bg-error/10 text-error'
              : 'border-base-300 bg-base-200 text-base-content/70'
          }`}
        >
          {formatMoney(selected.balance, selected.currency)}
        </span>
      )}
    </div>
  );
}
