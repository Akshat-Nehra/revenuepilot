import React from 'react';
import RecoveryAttemptsTable from '../components/recovery/RecoveryAttemptsTable.jsx';
import { MetricCardSkeleton, TableSkeleton } from '../components/common/Skeletons.jsx';
import ErrorState from '../components/common/ErrorState.jsx';

export default function RecoveryPage({ recoveryAttempts, loading, error, onSelectTransaction, onRetry }) {
  if (loading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>
        <TableSkeleton rows={6} cols={10} />
      </div>
    );
  }

  if (error) return <ErrorState title="Failed to load recovery attempts" message={error} onRetry={onRetry} />;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-white">Recovery Management</h2>
        <p className="text-xs text-slate-400 mt-1">
          Detailed tracking of all recovery attempts, Razorpay payment links, and webhook resolution
        </p>
      </div>

      <RecoveryAttemptsTable
        attempts={recoveryAttempts}
        onSelectTransaction={onSelectTransaction}
      />
    </div>
  );
}
