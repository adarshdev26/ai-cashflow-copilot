'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Transaction } from '../types';
import { DataTable } from '@/components/ui/DataTable';

interface TransactionTableProps {
  transactions?: Transaction[];
}

export function TransactionTable({ transactions = [] }: TransactionTableProps) {
  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => {
        const tx = row.original;
        return (
          <div className="font-medium text-slate-900 flex items-center gap-3">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
              tx.type === 'CREDIT' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              {tx.type === 'CREDIT' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
            </div>
            {tx.description || 'Untitled Transaction'}
          </div>
        );
      },
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.getValue('type') as string;
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            type === 'CREDIT' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
          }`}>
            {type}
          </span>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-slate-500">
          {new Date(row.getValue('createdAt') as string).toLocaleDateString()}
        </span>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => {
        const tx = row.original;
        return (
          <div className={`text-right font-semibold ${
            tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-900'
          }`}>
            {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount.toLocaleString()}
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={transactions}
      searchKey="description"
      searchPlaceholder="Search transactions..."
      pageSize={5}
    />
  );
}