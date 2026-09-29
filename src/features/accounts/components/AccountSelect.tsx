'use client';

import { useCallback, useMemo } from 'react';
import { Select } from '@/components/ui/Select';
import { useActiveWorkspaceId } from '@/features/workspaces';
import { useAccounts } from '../hooks/use-accounts';

interface CurrentAccount {
  id: string;
  name: string;
  isActive: boolean;
}

interface AccountSelectProps {
  value: string | null;
  onChange: (id: string | null) => void;
  /** The account a transaction already points to (shown even if inactive). */
  currentAccount?: CurrentAccount | null;
  disabled?: boolean;
  id?: string;
}

export function AccountSelect({ value, onChange, currentAccount, disabled, id }: AccountSelectProps) {
  const workspaceId = useActiveWorkspaceId();
  const { data: accounts, isLoading, error } = useAccounts(workspaceId, { activeOnly: true });

  const options = useMemo(() => {
    const list = (accounts ?? []).map((a) => ({ id: a.id, label: a.name }));
    if (currentAccount && !list.some((o) => o.id === currentAccount.id)) {
      list.unshift({
        id: currentAccount.id,
        label: currentAccount.isActive ? currentAccount.name : `${currentAccount.name} (inactive)`,
      });
    }
    return list;
  }, [accounts, currentAccount]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange(e.target.value === '' ? null : e.target.value);
    },
    [onChange]
  );

  return (
    <div>
      <Select id={id} value={value ?? ''} onChange={handleChange} disabled={disabled || isLoading}>
        {value === null && <option value="">{isLoading ? 'Loading accounts...' : 'Select account'}</option>}
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </Select>
      {error && <p className="mt-1 text-xs text-red-500">Failed to load accounts</p>}
      {!isLoading && !error && options.length === 0 && (
        <p className="mt-1 text-xs text-slate-500">No active accounts. Add one on the Accounts page.</p>
      )}
    </div>
  );
}