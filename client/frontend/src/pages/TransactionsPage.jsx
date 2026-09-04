import React from 'react';
import TransactionTable from '../components/transactions/TransactionTable.jsx';
import { TableSkeleton } from '../components/common/Skeletons.jsx';
import ErrorState from '../components/common/ErrorState.jsx';

export default function TransactionsPage({ transactions, loading, error, onSelectTransaction, onExecuteRecovery, onRetry }) {
  if (loading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-slate-800 rounded animate-pulse"></div>
          <div className="h-3.5 w-80 bg-slate-800/60 rounded animate-pulse"></div>
        </div>
        <TableSkeleton rows={8} cols={9} />
      </div>
    );
  }

  if (error) return <ErrorState title="Failed to load transactions" message={error} onRetry={onRetry} />;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-white">Revenue At Risk</h2>
        <p className="text-xs text-slate-400 mt-1">
          Monitor, filter, and inspect failed transaction declines eligible for AI recovery actions
        </p>
      </div>

      <TransactionTable
        transactions={transactions}
        onSelectTransaction={onSelectTransaction}
        onExecuteRecovery={onExecuteRecovery}
      />
    </div>
  );
}
