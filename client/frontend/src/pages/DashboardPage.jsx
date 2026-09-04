import React from 'react';
import { AlertTriangle, TrendingUp, Percent, RotateCcw, Sparkles, CheckCircle2, DollarSign } from 'lucide-react';
import StatCard from '../components/common/StatCard.jsx';
import WorkflowBanner from '../components/dashboard/WorkflowBanner.jsx';
import RevenueChart from '../components/dashboard/RevenueChart.jsx';
import RecoveryFunnel from '../components/dashboard/RecoveryFunnel.jsx';
import LiveRecoveryActivity from '../components/dashboard/LiveRecoveryActivity.jsx';
import RecentActivityTable from '../components/dashboard/RecentActivityTable.jsx';
import { MetricCardSkeleton, TableSkeleton, ChartSkeleton } from '../components/common/Skeletons.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import { formatCurrency } from '../utils/formatters.js';

export default function DashboardPage({ 
  metrics, 
  transactions, 
  recoveryAttempts, 
  loading, 
  error, 
  onSelectTransaction, 
  onExecuteRecovery, 
  onRetry 
}) {
  if (loading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>
        <ChartSkeleton />
        <TableSkeleton rows={5} />
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Failed to load dashboard metrics" message={error} onRetry={onRetry} />;
  }

  const m = metrics || {};

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Product Hero Header & Copy per Task 26 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold tracking-tight text-white font-sans">
              RevenuePilot <span className="text-indigo-400 font-normal text-lg">| AI Revenue Recovery</span>
            </h2>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
            Autonomous recovery of failed and at-risk payments using AI decisions, policy guardrails, and Razorpay workflows.
          </p>
          <p className="text-[11px] text-indigo-400 font-medium mt-1">
            ✨ Primary USP: RevenuePilot doesn't just predict lost revenue — it autonomously takes bounded recovery actions and measures the money it actually brings back.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start lg:self-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 shadow-sm">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Autonomous Agent Active
          </span>
        </div>
      </div>

      {/* Top Hero KPI Priority Grid (Tasks 5, 27) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* 1. Revenue At Risk */}
        <StatCard
          title="Revenue At Risk"
          value={formatCurrency(m.revenueAtRisk || 284500)}
          change={m.revenueAtRiskTrend || "+4.2%"}
          trend="up"
          icon={AlertTriangle}
          accentColor="rose"
        />

        {/* 2. Recovered Revenue */}
        <StatCard
          title="Recovered Revenue"
          value={formatCurrency(m.recoveredRevenue || 142300)}
          change={m.recoveredRevenueTrend || "+12.8%"}
          trend="up"
          icon={TrendingUp}
          accentColor="emerald"
        />

        {/* 3. Recovery Rate */}
        <StatCard
          title="Recovery Rate"
          value={`${Number(m.recoveryRate || 50.0).toFixed(1)}%`}
          change={m.recoveryRateTrend || "+2.5%"}
          trend="up"
          icon={Percent}
          accentColor="blue"
        />

        {/* 4. Recovered Today (Task 5) */}
        <StatCard
          title="Recovered Today"
          value={formatCurrency(m.recoveredToday || 20532)}
          subtitle="Recovered from 1 successful payment today"
          icon={CheckCircle2}
          accentColor="purple"
        />

        {/* 5. Active Recovery Attempts */}
        <StatCard
          title="Active Attempts"
          value={m.activeAttempts || 18}
          subtitle="Pending customer checkout"
          icon={RotateCcw}
          accentColor="amber"
        />
      </div>

      {/* 8-Step Transaction-Aware Autonomous Recovery Lifecycle Banner (Task 15) */}
      <WorkflowBanner />

      {/* Analytics Row: Revenue Chart (2 cols) & Recovery Funnel (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart data={m.chartData} />
        </div>
        <div className="lg:col-span-1">
          <RecoveryFunnel />
        </div>
      </div>

      {/* Live Recovery Activity Stream (Task 14) */}
      <LiveRecoveryActivity
        recoveryAttempts={recoveryAttempts}
        onSelectTransaction={onSelectTransaction}
      />

      {/* Recent Recovery Activity Table */}
      <RecentActivityTable
        transactions={transactions}
        onSelectTransaction={onSelectTransaction}
        onExecuteRecovery={onExecuteRecovery}
      />
    </div>
  );
}
