import React from 'react';
import AIDecisionsTable from '../components/ai/AIDecisionsTable.jsx';
import { MetricCardSkeleton, TableSkeleton } from '../components/common/Skeletons.jsx';
import ErrorState from '../components/common/ErrorState.jsx';

export default function AIDecisionsPage({ aiDecisions, loading, error, onSelectTransaction, onRetry }) {
  if (loading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>
        <TableSkeleton rows={6} cols={9} />
      </div>
    );
  }

  if (error) return <ErrorState title="Failed to load AI decisions" message={error} onRetry={onRetry} />;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-white">AI Decision Intelligence</h2>
        <p className="text-xs text-slate-400 mt-1">
          Inspect model recommendations, confidence scores, and safety guardrail checks
        </p>
      </div>

      <AIDecisionsTable
        decisions={aiDecisions}
        onSelectTransaction={onSelectTransaction}
      />
    </div>
  );
}
