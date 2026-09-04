import React from 'react';
import { RotateCcw, ArrowRight, CheckCircle2, Clock, XCircle, ExternalLink } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import StatusBadge from '../common/StatusBadge.jsx';

export default function LiveRecoveryActivity({ recoveryAttempts = [], onSelectTransaction }) {
  const latestAttempts = (recoveryAttempts || []).slice(0, 5);

  const getJourneySteps = (attempt) => {
    const isRecovered = attempt.status === 'recovered';
    const isFailed = attempt.status === 'failed';

    if (isRecovered) {
      return {
        path: "AI Decision → Guardrails → Payment Captured",
        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
      };
    } else if (isFailed) {
      return {
        path: "AI Decision → Guardrails → Card Retry Declined",
        color: "text-rose-400 bg-rose-500/10 border-rose-500/20"
      };
    }
    return {
      path: "AI Decision → Guardrails → Razorpay Link Dispatched",
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
    };
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 glass-panel">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-indigo-400" />
          <h3 className="text-base font-bold text-white">Live Recovery Activity</h3>
        </div>
        <span className="text-xs font-semibold text-slate-400">Autonomous Execution Stream</span>
      </div>

      <div className="space-y-3">
        {latestAttempts.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">No active recovery attempts recorded</p>
        ) : (
          latestAttempts.map((att) => {
            const journey = getJourneySteps(att);
            return (
              <div
                key={att.id}
                onClick={() => onSelectTransaction && onSelectTransaction(att.transactionId)}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-indigo-500/40 hover:bg-slate-900/80 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-indigo-400 group-hover:underline">
                    {att.transactionId}
                  </span>
                  <span className="font-bold text-white text-xs">
                    {formatCurrency(att.amount)}
                  </span>
                  <span className="font-mono text-[11px] font-semibold text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {att.action}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Journey Indicator */}
                  <span className={`hidden md:inline-flex text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${journey.color}`}>
                    {journey.path}
                  </span>

                  <StatusBadge status={att.status === 'payment_pending' ? 'Pending' : att.status} size="sm" />

                  <span className="text-[11px] text-slate-500 whitespace-nowrap">
                    {formatDate(att.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
