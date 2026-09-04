import React from 'react';
import AuditTimeline from '../components/audit/AuditTimeline.jsx';
import { TableSkeleton } from '../components/common/Skeletons.jsx';
import ErrorState from '../components/common/ErrorState.jsx';

export default function AuditLogPage({ auditLogs, loading, error, onRetry }) {
  if (loading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-slate-800 rounded animate-pulse"></div>
          <div className="h-3.5 w-80 bg-slate-800/60 rounded animate-pulse"></div>
        </div>
        <TableSkeleton rows={7} cols={4} />
      </div>
    );
  }

  if (error) return <ErrorState title="Failed to load audit logs" message={error} onRetry={onRetry} />;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-white">System Audit Log</h2>
        <p className="text-xs text-slate-400 mt-1">
          Chronological record of detection, guardrail evaluations, recovery actions, and Razorpay webhook events
        </p>
      </div>

      <AuditTimeline auditLogs={auditLogs} />
    </div>
  );
}
