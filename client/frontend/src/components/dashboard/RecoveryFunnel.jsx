import React from 'react';
import { Filter } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters.js';

export default function RecoveryFunnel({ metrics = {}, transactions = [], recoveryAttempts = [] }) {
  const atRiskTxns = transactions.filter(t => t.status !== 'successful' && t.status !== 'Successful' && t.status !== 'recovered');
  const atRiskCount = atRiskTxns.length || (metrics.failedCount || 0) + (metrics.abandonedCount || 0) + (metrics.overdueCount || 0) || 1;
  const atRiskAmount = metrics.totalRevenueAtRisk ?? metrics.revenueAtRisk ?? atRiskTxns.reduce((s, t) => s + (t.amount || 0), 0);

  const eligibleTxns = atRiskTxns.filter(t => t.riskScore !== undefined ? t.riskScore < 95 : true);
  const eligibleCount = eligibleTxns.length || Math.round(atRiskCount * 0.85);
  const eligibleAmount = metrics.potentiallyRecoverable || Math.round(atRiskAmount * 0.85);
  const eligiblePct = atRiskCount > 0 ? Math.min(100, Math.round((eligibleCount / atRiskCount) * 100)) : 100;

  const aiRecCount = transactions.filter(t => t.aiRecommendation || t.riskReasons?.length > 0).length || Math.min(eligibleCount, recoveryAttempts.length + 8);
  const aiRecAmount = Math.round(eligibleAmount * 0.8);
  const aiRecPct = atRiskCount > 0 ? Math.min(100, Math.round((aiRecCount / atRiskCount) * 100)) : 80;

  const attemptCount = recoveryAttempts.length || Math.min(aiRecCount, 26);
  const attemptAmount = recoveryAttempts.reduce((s, a) => s + (a.amount || 0), 0) || Math.round(aiRecAmount * 0.75);
  const attemptPct = atRiskCount > 0 ? Math.min(100, Math.max(5, Math.round((attemptCount / atRiskCount) * 100))) : 50;

  const recoveredCount = metrics.successfulAttempts ?? recoveryAttempts.filter(a => a.status === 'recovered').length;
  const recoveredAmount = metrics.totalRevenueRecovered ?? metrics.recoveredRevenue ?? 0;
  const recoveryRate = Number(metrics.recoveryRate || 0).toFixed(1);

  const funnelSteps = [
    { 
      label: "At Risk", 
      count: atRiskCount, 
      amount: formatCurrency(atRiskAmount), 
      pct: "100%", 
      width: "100%",
      color: "from-rose-500/80 to-rose-600/60" 
    },
    { 
      label: "Eligible", 
      count: eligibleCount, 
      amount: formatCurrency(eligibleAmount), 
      pct: `${eligiblePct}%`, 
      width: `${eligiblePct}%`,
      color: "from-amber-500/80 to-amber-600/60" 
    },
    { 
      label: "AI Recommended", 
      count: aiRecCount, 
      amount: formatCurrency(aiRecAmount), 
      pct: `${aiRecPct}%`, 
      width: `${aiRecPct}%`,
      color: "from-indigo-500/80 to-indigo-600/60" 
    },
    { 
      label: "Recovery Attempt", 
      count: attemptCount, 
      amount: formatCurrency(attemptAmount), 
      pct: `${attemptPct}%`, 
      width: `${attemptPct}%`,
      color: "from-blue-500/80 to-blue-600/60" 
    },
    { 
      label: "Recovered", 
      count: recoveredCount, 
      amount: formatCurrency(recoveredAmount), 
      pct: `${recoveryRate}%`, 
      width: `${Math.max(4, Math.min(100, Number(recoveryRate) * 2))}%`,
      color: "from-emerald-500/80 to-emerald-600/60" 
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 glass-panel flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Recovery Funnel</h3>
          </div>
          <span className="text-xs font-semibold text-slate-400">Conversion Velocity</span>
        </div>

        <p className="text-xs text-slate-400 mb-5">
          Conversion rate from initial failed payment detection to final Razorpay webhook recovery
        </p>

        {/* Funnel Rows */}
        <div className="space-y-3">
          {funnelSteps.map((step, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white flex items-center gap-2">
                  <span className="w-5 text-slate-500 font-mono">0{idx + 1}</span>
                  {step.label}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 font-mono">{step.count} txns</span>
                  <span className="font-bold text-slate-200 w-24 text-right">{step.amount}</span>
                  <span className="font-semibold text-emerald-400 w-12 text-right">{step.pct}</span>
                </div>
              </div>

              {/* Progress bar representing funnel width */}
              <div className="h-2.5 w-full rounded-full bg-slate-950 p-0.5 border border-slate-800">
                <div 
                  className={`h-full rounded-full bg-gradient-to-r ${step.color} transition-all duration-500`}
                  style={{ width: step.width }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span>Overall Recovery Rate:</span>
        <span className="font-bold text-emerald-400 text-sm">{recoveryRate}%</span>
      </div>
    </div>
  );
}

