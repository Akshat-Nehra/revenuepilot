import React from 'react';
import RecoveryRateChart from '../components/metrics/RecoveryRateChart.jsx';
import StrategyDistributionChart from '../components/metrics/StrategyDistributionChart.jsx';
import FailureReasonChart from '../components/metrics/FailureReasonChart.jsx';
import { MetricCardSkeleton, ChartSkeleton } from '../components/common/Skeletons.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import { formatCurrency } from '../utils/formatters.js';

export default function MetricsPage({ metrics, loading, error, onRetry }) {
  if (loading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Failed to load metrics" message={error} onRetry={onRetry} />;
  }

  const m = metrics || {};

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-white">Recovery Analytics & Performance</h2>
        <p className="text-xs text-slate-400 mt-1">
          Deep metrics into strategy conversion rates, decline cause breakdowns, and recovery velocity
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 glass-panel">
          <span className="text-[11px] text-slate-400 font-medium">Total At Risk</span>
          <h4 className="text-base font-bold text-rose-400 mt-1">{formatCurrency(m.totalRevenueAtRisk ?? m.revenueAtRisk ?? 0)}</h4>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 glass-panel">
          <span className="text-[11px] text-slate-400 font-medium">Total Recovered</span>
          <h4 className="text-base font-bold text-emerald-400 mt-1">{formatCurrency(m.totalRevenueRecovered ?? m.recoveredRevenue ?? 0)}</h4>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 glass-panel">
          <span className="text-[11px] text-slate-400 font-medium">Recovery Rate</span>
          <h4 className="text-base font-bold text-indigo-400 mt-1">{Number(m.recoveryRate || 0).toFixed(1)}%</h4>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 glass-panel">
          <span className="text-[11px] text-slate-400 font-medium">Recovered Today</span>
          <h4 className="text-base font-bold text-purple-400 mt-1">{formatCurrency(m.recoveredToday || 0)}</h4>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 glass-panel">
          <span className="text-[11px] text-slate-400 font-medium">Avg Recovery Time</span>
          <h4 className="text-base font-bold text-white mt-1">{m.averageRecoveryTime || "0.0 hrs"}</h4>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 glass-panel">
          <span className="text-[11px] text-slate-400 font-medium">Successful Attempts</span>
          <h4 className="text-base font-bold text-emerald-400 mt-1">{m.successfulAttempts || 0}</h4>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 glass-panel">
          <span className="text-[11px] text-slate-400 font-medium">Failed Attempts</span>
          <h4 className="text-base font-bold text-rose-400 mt-1">{m.failedAttempts || 0}</h4>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecoveryRateChart data={m.recoveryRateTrend || m.chartData} currentRate={m.recoveryRate} />
        <StrategyDistributionChart data={m.recoveryByStrategy} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <FailureReasonChart data={m.recoveryByFailureReason} />
        </div>

        {/* Strategy Table Breakdown */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 glass-panel">
          <h3 className="text-base font-bold text-white mb-1">Strategy Performance Matrix</h3>
          <p className="text-xs text-slate-400 mb-4">Detailed breakdown of strategy execution counts and conversion</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] bg-slate-950/40">
                  <th className="py-2.5 px-3">Strategy</th>
                  <th className="py-2.5 px-3 text-center">Executions</th>
                  <th className="py-2.5 px-3">Amount Recovered</th>
                  <th className="py-2.5 px-3">Success Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {(m.recoveryByStrategy && m.recoveryByStrategy.length > 0) ? (
                  m.recoveryByStrategy.map((strat) => {
                    let colorClass = "text-indigo-400";
                    if (strat.strategy === "PAYMENT_LINK") colorClass = "text-cyan-400";
                    else if (strat.strategy === "SEND_REMINDER") colorClass = "text-emerald-400";
                    else if (strat.strategy === "STOP") colorClass = "text-slate-400";

                    return (
                      <tr key={strat.strategy}>
                        <td className={`py-3 px-3 font-semibold ${colorClass}`}>{strat.strategy}</td>
                        <td className="py-3 px-3 text-center text-slate-200">{strat.count || 0}</td>
                        <td className="py-3 px-3 font-bold text-emerald-400">{formatCurrency(strat.amount || 0)}</td>
                        <td className={`py-3 px-3 font-bold ${strat.successRate > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                          {strat.successRate || 0}%
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-500 font-sans">
                      No strategy performance data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
