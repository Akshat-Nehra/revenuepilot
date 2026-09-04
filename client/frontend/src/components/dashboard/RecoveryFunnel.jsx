import React from 'react';
import { Filter, ArrowDown } from 'lucide-react';

export default function RecoveryFunnel() {
  const funnelSteps = [
    { label: "At Risk", count: 36, amount: "₹2,84,500", pct: "100%", color: "from-rose-500/80 to-rose-600/60" },
    { label: "Eligible", count: 32, amount: "₹2,52,000", pct: "88.8%", color: "from-amber-500/80 to-amber-600/60" },
    { label: "AI Recommended", count: 28, amount: "₹2,21,400", pct: "87.5%", color: "from-indigo-500/80 to-indigo-600/60" },
    { label: "Recovery Attempt", count: 24, amount: "₹1,89,000", pct: "85.7%", color: "from-blue-500/80 to-blue-600/60" },
    { label: "Recovered", count: 14, amount: "₹1,42,300", pct: "58.3%", color: "from-emerald-500/80 to-emerald-600/60" },
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
                  <span className="font-bold text-slate-200 w-20 text-right">{step.amount}</span>
                  <span className="font-semibold text-emerald-400 w-12 text-right">{step.pct}</span>
                </div>
              </div>

              {/* Progress bar representing funnel width */}
              <div className="h-2.5 w-full rounded-full bg-slate-950 p-0.5 border border-slate-800">
                <div 
                  className={`h-full rounded-full bg-gradient-to-r ${step.color} transition-all duration-500`}
                  style={{ width: step.pct }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span>Overall Recovery Rate:</span>
        <span className="font-bold text-emerald-400 text-sm">50.0%</span>
      </div>
    </div>
  );
}
