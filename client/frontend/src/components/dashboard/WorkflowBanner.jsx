import React from 'react';
import { 
  AlertTriangle, 
  Search, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  CreditCard, 
  UserCheck, 
  CheckCircle2, 
  Clock
} from 'lucide-react';

export default function WorkflowBanner({ selectedTransaction }) {
  // Determine current lifecycle step if a transaction is selected
  const getStepStatus = (stepIndex) => {
    if (!selectedTransaction) {
      return { state: 'default' }; // Generic overview mode
    }

    const isRecovered = selectedTransaction.status === 'Recovered';
    const hasPaymentLink = !!selectedTransaction.razorpayUrl || (selectedTransaction.attemptsCount > 0);
    const isFailed = selectedTransaction.status === 'Failed';

    // Step 0: Detect Risk (Always passed for at-risk txn)
    if (stepIndex === 0) return { state: 'completed' };
    // Step 1: Analyze
    if (stepIndex === 1) return { state: 'completed' };
    // Step 2: AI Action
    if (stepIndex === 2) return { state: 'completed' };
    // Step 3: Guardrails
    if (stepIndex === 3) return { state: 'completed' };
    // Step 4: Execute
    if (stepIndex === 4) return { state: hasPaymentLink ? 'completed' : 'active' };
    // Step 5: Razorpay Link
    if (stepIndex === 5) return { state: hasPaymentLink ? 'completed' : 'pending' };
    // Step 6: Customer Payment
    if (stepIndex === 6) return { state: isRecovered ? 'completed' : hasPaymentLink ? 'active' : 'pending' };
    // Step 7: Recovered
    if (stepIndex === 7) return { state: isRecovered ? 'completed' : isFailed ? 'failed' : 'pending' };

    return { state: 'default' };
  };

  const steps = [
    { title: "Detect Risk", desc: "Failed Transaction", icon: AlertTriangle },
    { title: "Analyze", desc: "History & Context", icon: Search },
    { title: "AI Action", desc: "Strategy Selected", icon: Sparkles },
    { title: "Guardrails", desc: "Policy Evaluation", icon: ShieldCheck },
    { title: "Execute", desc: "Action Dispatched", icon: Zap },
    { title: "Razorpay Link", desc: "Payment Link Created", icon: CreditCard },
    { title: "Customer Payment", desc: "Checkout Processed", icon: UserCheck },
    { title: "Recovered", desc: "Revenue Recovered", icon: CheckCircle2 },
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-slate-950/40 p-5 shadow-xl glass-panel">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Autonomous Recovery Lifecycle
          </h3>
          {selectedTransaction && (
            <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              {selectedTransaction.id}
            </span>
          )}
        </div>
        <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
          Razorpay Webhooks & AI Agent
        </span>
      </div>

      {/* Horizontal Flow Container */}
      <div className="overflow-x-auto pb-2">
        <div className="flex items-center gap-2 min-w-max">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const { state } = getStepStatus(idx);

            let boxStyle = "border-slate-800 bg-slate-900/80 text-slate-400";
            let iconStyle = "text-slate-400 bg-slate-800/60 border-slate-700";
            let badge = null;

            if (state === 'completed') {
              boxStyle = "border-emerald-500/40 bg-emerald-950/20 shadow-sm shadow-emerald-950/30";
              iconStyle = "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
              badge = "✓ Done";
            } else if (state === 'active') {
              boxStyle = "border-indigo-500/50 bg-indigo-950/30 animate-pulse-subtle";
              iconStyle = "text-indigo-400 bg-indigo-500/20 border-indigo-500/40";
              badge = "⏳ In Progress";
            } else if (state === 'failed') {
              boxStyle = "border-rose-500/40 bg-rose-950/20";
              iconStyle = "text-rose-400 bg-rose-500/10 border-rose-500/30";
              badge = "✕ Failed";
            }

            return (
              <React.Fragment key={idx}>
                <div className={`flex flex-col items-center p-2.5 rounded-xl border w-32 transition-all ${boxStyle}`}>
                  <div className={`p-2 rounded-lg border mb-1.5 ${iconStyle}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold text-white text-center leading-tight">{step.title}</span>
                  <span className="text-[10px] text-slate-400 text-center mt-0.5">{step.desc}</span>
                  {badge && (
                    <span className="text-[9px] font-bold mt-1 px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                      {badge}
                    </span>
                  )}
                </div>

                {idx < steps.length - 1 && (
                  <div className={`font-bold text-xs shrink-0 ${state === 'completed' ? 'text-emerald-400' : 'text-slate-600'}`}>
                    →
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
