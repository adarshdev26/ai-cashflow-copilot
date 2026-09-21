'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { PrimaryButton, Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { CategorySelect } from '@/features/categories/components/CategorySelect';
import { Transaction } from '../types';

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    onSubmit({
      amount: Number(amount),
      type,
      description: description || undefined,
      categoryId,
    });
  };

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
          <PrimaryButton onClick={handleSubmit} loading={isSubmitting} disabled={isSubmitting || !amount}>
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
            onChange={(e) => setDescription(e.target.value)}
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
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Type</label>
          <Select
            value={type}
            onChange={(e) => setType(e.target.value as 'CREDIT' | 'DEBIT')}
          >
            <option value="CREDIT">Credit (Income)</option>
            <option value="DEBIT">Debit (Expense)</option>
          </Select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
          <CategorySelect
            value={categoryId}
            onChange={setCategoryId}
          />
        </div>
      </form>
    </Modal>
  );
}
