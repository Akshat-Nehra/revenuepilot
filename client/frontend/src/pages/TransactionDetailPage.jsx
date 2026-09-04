import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getTransactionById, evaluateAIRecovery, executeRecovery } from '../services/api.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import { DetailsSkeleton } from '../components/common/Skeletons.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import ExecutionModal from '../components/common/ExecutionModal.jsx';
import {
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  Brain,
  Zap,
  ExternalLink,
  Copy,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  User,
  Mail,
  Loader2,
  Check
} from 'lucide-react';

export default function TransactionDetailPage({ onRecoveryExecuted }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [txn, setTxn] = useState(null);
  const [aiData, setAiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Execution & Recovery State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recoverySuccessNotice, setRecoverySuccessNotice] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [txnRes, aiRes] = await Promise.all([
        getTransactionById(id),
        evaluateAIRecovery(id)
      ]);
      setTxn(txnRes.data);
      setAiData(aiRes.data);
    } catch (err) {
      setError(err.message || "Failed to load transaction details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const handleExecute = async () => {
    setIsExecuting(true);
    try {
      const identifier = txn.transactionId || txn.id || txn._id;
      const res = await executeRecovery(identifier);
      setIsModalOpen(false);

      if (res.action === 'SEND_REMINDER') {
        const updatedTxn = {
          ...txn,
          recoveryState: 'REMINDER_SENT',
          attemptsCount: (txn.attemptsCount || 0) + 1,
          lastAttemptAt: new Date().toISOString()
        };
        setTxn(updatedTxn);
        setRecoverySuccessNotice(`Recovery reminder recorded! Connect an SMS/email provider for external delivery.`);
        if (onRecoveryExecuted) {
          onRecoveryExecuted(res);
        }
        return;
      }

      const paymentLinkUrl = res.paymentLink?.short_url || res.paymentLinkUrl || res.short_url || res.data?.paymentLink;

      if (!paymentLinkUrl) {
        throw new Error(res.message || "Backend did not return a Razorpay payment link");
      }
      
      const updatedTxn = {
        ...txn,
        status: 'Pending',
        recoveryState: 'PENDING',
        razorpayUrl: paymentLinkUrl,
        paymentLink: paymentLinkUrl,
        short_url: paymentLinkUrl,
        razorpayLinkId: res.paymentLink?.id || res.paymentLinkId || res.data?.paymentLinkId,
        attemptsCount: (txn.attemptsCount || 0) + 1,
        lastAttemptAt: new Date().toISOString()
      };

      setTxn(updatedTxn);
      setRecoverySuccessNotice(`Recovery initiated! Razorpay Payment Link active.`);
      
      if (onRecoveryExecuted) {
        onRecoveryExecuted(res);
      }
    } catch (err) {
      alert(err.message || "Failed to execute recovery.");
    } finally {
      setIsExecuting(false);
    }
  };

  const copyToClipboard = (url) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-12 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-800 animate-pulse"></div>
          <div className="h-6 w-48 bg-slate-800 rounded animate-pulse"></div>
        </div>
        <DetailsSkeleton />
      </div>
    );
  }

  if (error || !txn) {
    return (
      <div className="space-y-6 pb-12">
        <Link to="/transactions" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back to Transactions
        </Link>
        <ErrorState title="Transaction Not Found" message={error || "Transaction ID does not exist."} onRetry={loadData} />
      </div>
    );
  }

  const isRecovered = txn.status === 'Recovered' || txn.recoveryState === 'RECOVERED';
  const isPendingPayment = (txn.status === 'Pending' && txn.razorpayUrl) || txn.recoveryState === 'PENDING';
  const isReminderSent = txn.recoveryState === 'REMINDER_SENT' || txn.recoveryStatus === 'reminder_sent';
  const allGuardrailsPassed = txn.guardrails?.every(g => g.status === 'PASSED') ?? true;
  const canExecute = !isRecovered && !isPendingPayment && !isReminderSent && allGuardrailsPassed;

  return (
    <div className="space-y-6 pb-16 animate-fade-in max-w-6xl mx-auto">
      
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/transactions')}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-extrabold text-white">{txn.id}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                txn.riskLevel === 'HIGH' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' :
                txn.riskLevel === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              }`}>
                {txn.riskLevel} RISK ({txn.riskScore}%)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Detected on {formatDate(txn.createdAt)} • Payment decline analysis & recovery
            </p>
          </div>
        </div>

        {/* Action Button */}
        {canExecute && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all self-start sm:self-auto"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Execute Recovery</span>
          </button>
        )}
      </div>

      {/* Recovery Success Banner */}
      {recoverySuccessNotice && (
        <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4 flex items-center justify-between gap-3 text-xs text-indigo-200 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
            <span>{recoverySuccessNotice}</span>
          </div>
          {txn.razorpayUrl && (
            <a
              href={txn.razorpayUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0"
            >
              <span>Open Link</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      {/* Active Recovery Attempt Status (Payment Pending) */}
      {isPendingPayment && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 space-y-3 glass-panel">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <h4 className="text-sm font-bold text-amber-200">
                Recovery Initiated — Waiting for Customer Payment
              </h4>
            </div>
            <span className="text-xs font-mono font-semibold text-amber-300">
              Attempt #{txn.attemptsCount || 1}
            </span>
          </div>

          <p className="text-xs text-amber-200/80 leading-relaxed">
            A Razorpay Payment Link has been generated and dispatched. RevenuePilot is monitoring webhooks for payment completion.
          </p>

          {txn.razorpayUrl && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950/80 border border-amber-500/20 text-xs font-mono text-amber-200 select-all break-all">
                <span className="truncate">{txn.razorpayUrl}</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href={txn.razorpayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md transition-all"
                >
                  <span>Open Razorpay Payment Link</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => copyToClipboard(txn.razorpayUrl)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 font-semibold text-xs flex items-center gap-2 transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied to Clipboard' : 'Copy Payment Link'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reminder Sent Banner */}
      {isReminderSent && !isRecovered && (
        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5 space-y-3 glass-panel">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <Mail className="w-5 h-5 text-blue-400 shrink-0" />
              <h4 className="text-sm font-bold text-blue-200">
                Recovery Reminder Dispatched
              </h4>
            </div>
            <span className="text-xs font-mono font-semibold text-blue-300">
              Attempt #{txn.attemptsCount || 1}
            </span>
          </div>

          <p className="text-xs text-blue-200/80 leading-relaxed">
            A recovery reminder has been recorded for this customer. RevenuePilot is monitoring for customer response or payment completion.
          </p>
          <p className="text-[11px] text-slate-400">
            ℹ️ Connect an SMS/email provider for automated external customer delivery.
          </p>
        </div>
      )}

      {/* Recovered Status Banner */}
      {isRecovered && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 space-y-2 glass-panel">
          <div className="flex items-center gap-2 text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h4 className="text-sm font-bold">Revenue Recovered Successfully</h4>
          </div>
          <p className="text-xs text-emerald-200/80">
            Payment of {formatCurrency(txn.amount)} was captured and verified via Razorpay webhook.
          </p>
        </div>
      )}

      {/* 2-Column Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Transaction Details (1 col) */}
        <div className="space-y-6">
          
          {/* Card: Financial Summary */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 glass-panel">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Transaction Summary</h3>
              <CreditCard className="w-4 h-4 text-indigo-400" />
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Amount At Risk</span>
                <span className="text-2xl font-extrabold text-white tracking-tight">{formatCurrency(txn.amount)}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/60">
                <div>
                  <span className="text-slate-500 block text-[11px]">Payment Status</span>
                  <span className={`font-semibold ${
                    isRecovered ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {txn.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Payment Method</span>
                  <span className="font-semibold text-slate-200 font-mono">{txn.paymentMethod || 'UPI'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/60">
                <span className="text-slate-500 block text-[11px]">Failure Reason</span>
                <span className="font-semibold text-rose-300">{txn.failureReason || 'Insufficient Funds'}</span>
              </div>
            </div>
          </div>

          {/* Card: Customer Profile */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3 glass-panel text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Customer Details</h3>
              <User className="w-4 h-4 text-indigo-400" />
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-slate-500 block text-[11px]">Customer Name</span>
                <span className="font-semibold text-white text-sm">{txn.customerName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Email Address</span>
                <span className="font-mono text-slate-300">{txn.customerEmail}</span>
              </div>
              <div className="pt-2 border-t border-slate-800/60">
                <span className="text-slate-500 block text-[11px]">Total Recovery Attempts</span>
                <span className="font-semibold text-slate-200">
                  {txn.attemptsCount || 0} / 3 Allowed
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: AI Analysis & Guardrails (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* AI Recommendation Card */}
          <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/30 to-slate-900/60 p-6 space-y-4 glass-panel">
            <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">AI Recovery Recommendation</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold">
                Confidence: {txn.aiRecommendation?.confidence || 87}%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Recommended Action</span>
                <span className="font-bold text-indigo-400 text-xs font-mono">
                  {txn.aiRecommendation?.action || 'PAYMENT_LINK'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Recovery Strategy</span>
                <span className="font-bold text-slate-200 text-xs">
                  {txn.aiRecommendation?.strategy || 'PAYMENT_LINK'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Urgency Level</span>
                <span className={`font-bold text-xs ${
                  txn.aiRecommendation?.urgency === 'HIGH' ? 'text-rose-400' : 'text-amber-400'
                }`}>
                  {txn.aiRecommendation?.urgency || 'MEDIUM'}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
              <span className="text-indigo-400 font-bold block mb-1">AI Strategic Rationale:</span>
              {txn.aiRecommendation?.reason || txn.aiAnalysis || "Customer has previous successful payment history and is eligible for autonomous payment recovery workflow."}
            </div>
          </div>

          {/* Policy Guardrails Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 glass-panel">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Policy Guardrails & Eligibility Gate</h3>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                allGuardrailsPassed
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}>
                {allGuardrailsPassed ? '✓ APPROVED FOR RECOVERY' : '✕ RECOVERY BLOCKED'}
              </span>
            </div>

            <div className="space-y-2.5">
              {txn.guardrails?.map((g) => {
                const passed = g.status === 'PASSED';
                return (
                  <div
                    key={g.id}
                    className="flex items-start justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
                  >
                    <div className="flex items-start gap-2.5">
                      {passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-semibold text-white">{g.name}</span>
                        <p className="text-[11px] text-slate-400 mt-0.5">{g.detail}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {g.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* Execution Confirmation Modal */}
      {isModalOpen && (
        <ExecutionModal
          isOpen={isModalOpen}
          transaction={txn}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleExecute}
          isExecuting={isExecuting}
        />
      )}

    </div>
  );
}
