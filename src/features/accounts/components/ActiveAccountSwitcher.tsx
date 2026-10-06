'use client';

import { Landmark } from 'lucide-react';
import { Select } from '@/components/ui/Select';
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
        <div
            className="flex min-w-0 items-center gap-2"
            data-tour={accounts?.length ? 'account-switcher' : undefined}
        >
            <Landmark className="text-base-content/50 h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1 md:w-48 md:flex-none">
                <Select
                    value={activeAccountId ?? ''}
                    onChange={(e) => setActiveAccountId(e.target.value || null)}
                    disabled={isLoading}
                    aria-label="Select account"
                >
                    <option value="">All accounts</option>
                    {accounts?.map((a) => (
                        <option key={a.id} value={a.id}>
                            {a.isActive ? a.name : `${a.name} (inactive)`}
                        </option>
                    ))}
                </Select>
            </div>
            {selected && (
                <span
                    className={`hidden shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium lg:inline ${
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
