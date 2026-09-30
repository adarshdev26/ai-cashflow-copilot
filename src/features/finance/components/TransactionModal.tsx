'use client';

import { useState, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { PrimaryButton, Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { CategorySelect } from '@/resources/components/CategorySelect';
import { useCategoryMap } from '@/resources/hooks/use-categories';
import { Transaction, CreateTransactionInput } from '../types';
import { AccountSelect, useAccounts, useActiveAccountId } from '@/features/accounts';
import { useActiveWorkspaceId, usePermission } from '@/features/workspaces';
import { CategoryFormModal } from '@/features/categories/components/CategoryFormModal';

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CreateTransactionInput) => void;
  isSubmitting: boolean;
  error?: string;
  transaction?: Transaction | null;
}

export function TransactionModal({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  error,
  transaction
}: TransactionModalProps) {
  const isEdit = !!transaction;
  const title = isEdit ? 'Edit transaction' : 'Add transaction';
  const submitLabel = isEdit ? 'Save changes' : 'Save Transaction';

  const [description, setDescription] = useState(transaction?.description || '');
  const [amount, setAmount] = useState(transaction?.amount ? String(transaction.amount) : '');
  const [type, setType] = useState<'CREDIT' | 'DEBIT'>(transaction?.type || 'CREDIT');
  const [categoryId, setCategoryId] = useState<string | null>(transaction?.categoryId || null);

  const workspaceId = useActiveWorkspaceId();
  const canCreateCategory = usePermission('category.create');
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const categoryMap = useCategoryMap();

  const { data: activeAccounts, isLoading: accountsLoading } = useAccounts(workspaceId, { activeOnly: true });
  // null = user hasn't picked; on create we fall back to the first active account.
  const [pickedAccountId, setPickedAccountId] = useState<string | null>(transaction?.accountId ?? null);
  const [activeAccountId] = useActiveAccountId();
  const preferredAccountId =
    activeAccountId && activeAccounts?.some((a) => a.id === activeAccountId)
      ? activeAccountId
      : activeAccounts?.[0]?.id ?? null;
  const accountId = pickedAccountId ?? (isEdit ? null : preferredAccountId);

  const handleSubmit = useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();
      if (!amount || !accountId) return;

      onSubmit({
        amount: Number(amount),
        type,
        description: description || undefined,
        categoryId,
        accountId,
      });
    },
    [amount, type, description, categoryId, accountId, onSubmit]
  );

  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value),
    []
  );

  const handleAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value),
    []
  );

  const handleTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const next = e.target.value as 'CREDIT' | 'DEBIT';
      setType(next);
      // drop the selected category if it doesn't fit the new type
      const cat = categoryId ? categoryMap[categoryId] : null;
      if (cat?.type && cat.type !== 'BOTH' && cat.type !== next) setCategoryId(null);
    },
    [categoryId, categoryMap]
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      closeOnBackdrop={!isSubmitting}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <PrimaryButton
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting || !amount || !accountId || (!isEdit && accountsLoading)}
          >
            {submitLabel}
          </PrimaryButton>
        </>
      }
    >
      <form id="transaction-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
          <Input
            type="text"
            value={description}
            onChange={handleDescriptionChange}
            placeholder="e.g., Client Freelance Payment"
            maxLength={255}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Amount</label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            required
            value={amount}
            onChange={handleAmountChange}
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Type</label>
          <Select
            value={type}
            onChange={handleTypeChange}
          >
            <option value="CREDIT">Credit (Income)</option>
            <option value="DEBIT">Debit (Expense)</option>
          </Select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Account</label>
          <AccountSelect
            value={accountId}
            onChange={setPickedAccountId}
            currentAccount={transaction?.account ?? null}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
          <CategorySelect
            value={categoryId}
            onChange={setCategoryId}
            transactionType={type}
            onAddNew={canCreateCategory ? () => setAddCategoryOpen(true) : undefined}
          />
        </div>
      </form>

      {addCategoryOpen && workspaceId && (
        <CategoryFormModal
          open
          onClose={() => setAddCategoryOpen(false)}
          workspaceId={workspaceId}
          defaultType={type}
          onSaved={(created) => {
            if (created.type === 'BOTH' || created.type === type) setCategoryId(created.id);
          }}
        />
      )}
    </Modal>
  );
}
