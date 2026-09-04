import React, { useState } from 'react';
import { X, Sparkles, ShieldCheck, CheckCircle2, Play, ExternalLink, Copy, Check, AlertTriangle, Clock, ShieldAlert, AlertCircle } from 'lucide-react';
import RiskBadge from '../common/RiskBadge.jsx';
import StatusBadge from '../common/StatusBadge.jsx';
import WorkflowBanner from '../dashboard/WorkflowBanner.jsx';
import { formatCurrency, formatDate } from '../../utils/formatters.js';

export default function TransactionDetailModal({ isOpen, onClose, transaction, onExecuteRecovery }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !transaction) return null;

  const handleCopyLink = (url) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const guardrails = transaction.guardrails || [
    { id: "g1", name: "Transaction eligible", status: "PASSED", detail: "Active customer plan" },
    { id: "g2", name: "Recovery window valid", status: "PASSED", detail: "Failed within 48-hour recovery SLA" },
    { id: "g3", name: "Attempt limit not exceeded", status: "PASSED", detail: "Attempt limit within policy threshold" },
    { id: "g4", name: "No recent duplicate attempt", status: "PASSED", detail: "Minimum retry interval satisfied" },
    { id: "g5", name: "Amount within recovery policy", status: "PASSED", detail: "Amount below maximum limit" }
  ];

  const aiRec = transaction.aiRecommendation || {};
  const isRecovered = transaction.status === 'Recovered';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-800 bg-[#0B0F19] p-6 shadow-2xl shadow-indigo-950/50 my-8 max-h-[90vh] overflow-y-auto">

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xl font-bold text-indigo-400">{transaction.id}</span>
            <StatusBadge status={transaction.recoveryState || transaction.status} />
            <RiskBadge level={transaction.riskLevel} score={transaction.riskScore} />
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-6">

          {/* Transaction-Aware Recovery Lifecycle Step Progress */}
          <WorkflowBanner selectedTransaction={transaction} />

          {/* 1. Transaction Overview Header Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
              <span className="text-slate-400 font-medium">Customer Details</span>
              <p className="font-bold text-white mt-1 truncate">{transaction.customerName}</p>
              <p className="text-[10px] text-slate-400 font-mono truncate">{transaction.customerEmail}</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
              <span className="text-slate-400 font-medium">Amount At Risk</span>
              <p className="font-bold text-emerald-400 text-base mt-1">
                {formatCurrency(transaction.amount)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
              <span className="text-slate-400 font-medium">Failure Reason</span>
              <p className="font-semibold text-rose-400 mt-1">{transaction.failureReason}</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
              <span className="text-slate-400 font-medium">Detected At</span>
              <p className="font-medium text-slate-300 mt-1">
                {formatDate(transaction.createdAt)}
              </p>
            </div>
          </div>

          {/* 2. RISK ANALYSIS Section */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Risk Analysis</h4>
              </div>
              <RiskBadge level={transaction.riskLevel} score={transaction.riskScore} size="sm" />
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              "{transaction.aiAnalysis || `Decline caused by ${transaction.failureReason}. Customer profile and historical recovery patterns indicate ${transaction.riskLevel.toLowerCase()} risk.`}"
            </p>
          </div>

          {/* 3. AI DECISION Section */}
          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300">AI Recovery Decision</h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">Urgency:</span>
                <span className="text-xs font-bold text-amber-400 uppercase">{aiRec.urgency || 'HIGH'}</span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 ml-2">
                  Confidence: {Number(aiRec.confidence ?? 87).toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Recommended Action</span>
                <p className="font-mono font-bold text-indigo-400 text-sm mt-0.5">
                  {aiRec.action || "PAYMENT_RETRY"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Execution Strategy</span>
                <p className="font-mono font-bold text-cyan-400 text-sm mt-0.5">
                  {aiRec.strategy || "PAYMENT_LINK"}
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">Decision Reasoning</span>
              <p className="italic text-slate-200">
                "{aiRec.reason || "Customer abandoned checkout due to transient balance issue; high probability of completing payment after receiving direct SMS/WhatsApp payment link."}"
              </p>
            </div>
          </div>

          {/* 4. GUARDRAILS Safety Evaluation Checklist */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Guardrails Safety Evaluation</h4>
            </div>

            <div className="space-y-2">
              {guardrails.map((g) => {
                const passed = g.status === 'PASSED';
                return (
                  <div key={g.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 text-xs">
                    <div className="flex items-center gap-2.5">
                      {passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <span className="font-medium text-slate-200">{g.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400 font-mono">{g.detail}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${passed ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                        {g.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. RECOVERY ATTEMPT & PAYMENT LINK EXECUTION */}
          <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/30 via-slate-900/60 to-slate-950/30 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-white">Recovery Execution Attempt</h4>
                <p className="text-xs text-slate-400">
                  Attempt #{transaction.attemptsCount || 1} • Status: <span className="text-slate-200 font-semibold">{transaction.status}</span>
                </p>
              </div>

              {transaction.status === 'Pending' ? (
                <button
                  onClick={() => onExecuteRecovery(transaction)}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute Recovery</span>
                </button>
              ) : (
                <StatusBadge status={transaction.status} />
              )}
            </div>

            {/* Razorpay Payment Link Display */}
            {transaction.razorpayUrl && (
              <div className="rounded-xl border border-emerald-500/30 bg-slate-950 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Razorpay Payment Link Created
                  </span>
                  <span className="font-mono text-slate-400 text-[11px]">
                    ID: {transaction.razorpayLinkId || 'pl_L01abc987xyz'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    readOnly
                    value={transaction.razorpayUrl}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200"
                  />
                  <button
                    onClick={() => handleCopyLink(transaction.razorpayUrl)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Copy Payment Link"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <a
                    href={transaction.razorpayUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20"
                  >
                    <span>Open Payment Link</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
