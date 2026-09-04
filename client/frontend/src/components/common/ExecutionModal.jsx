import React, { useState } from 'react';
import { X, Sparkles, ExternalLink, Copy, Check, Loader2, ArrowRight, AlertTriangle, Mail } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters.js';
import { isValidRazorpayUrl } from '../../utils/normalize.js';

export default function ExecutionModal({ isOpen, onClose, transaction, onConfirm }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !transaction) return null;

  const attemptNum = (transaction.attemptsCount || 0) + 1;
  const formattedAmount = formatCurrency(transaction.amount);

  const handleExecute = async () => {
    if (loading) return; // Prevent duplicate clicks
    setLoading(true);
    setError(null);
    try {
      const identifier = transaction.transactionId || transaction.id || transaction._id;
      const res = await onConfirm(identifier);
      setResult(res);
    } catch (err) {
      console.error("Execution error:", err);
      setError(err.message || "Recovery execution failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (url) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenLink = (url) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCloseModal = () => {
    setResult(null);
    setError(null);
    onClose();
  };

  const aiRec = transaction.aiRecommendation || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-800 bg-[#0B0F19] p-6 shadow-2xl shadow-indigo-950/50">

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg p-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Execute Recovery Action</h3>
              <p className="text-xs text-slate-400">Transaction ID: {transaction.transactionId || transaction.id}</p>
            </div>
          </div>
          <button
            onClick={handleCloseModal}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!result ? (
          /* Confirmation Content */
          <div className="mt-5 space-y-4">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <p className="text-sm font-medium text-slate-200 leading-relaxed">
                RevenuePilot is about to execute recovery attempt <span className="font-bold text-amber-400">#{attemptNum}</span> for <span className="font-bold text-emerald-400">{formattedAmount}</span>.
              </p>
            </div>

            {/* Summary Details */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-xs text-slate-400">Target Customer</span>
                <p className="font-semibold text-white mt-0.5 truncate">{transaction.customerName}</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-xs text-slate-400">Amount at Risk</span>
                <p className="font-bold text-emerald-400 mt-0.5">{formattedAmount}</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-xs text-slate-400">AI Action</span>
                <p className="font-mono font-semibold text-indigo-400 mt-0.5">
                  {aiRec.action || "PAYMENT_LINK"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-xs text-slate-400">AI Confidence</span>
                <p className="font-bold text-emerald-400 mt-0.5">
                  {Number(aiRec.confidence ?? 87).toFixed(0)}%
                </p>
              </div>
            </div>

            {/* AI Reasoning */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 text-xs text-slate-300">
              <span className="font-semibold text-indigo-400 uppercase tracking-wider block mb-1">AI Recommendation Reason:</span>
              <p className="italic text-slate-300 leading-relaxed">
                "{aiRec.reason || "High recovery likelihood based on transaction history and transient failure reason."}"
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div><span className="font-semibold text-red-200">Recovery failed:</span> {error}</div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-2 border-t border-slate-800/80">
              <button
                onClick={handleCloseModal}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExecute}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Executing recovery...
                  </>
                ) : (
                  <>
                    Execute Recovery
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Result Screen */
          <div className="mt-5 space-y-4">
            {(() => {
              // 1. Result for SEND_REMINDER action
              if (result.action === 'SEND_REMINDER') {
                return (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-center">
                      <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-2 border border-blue-500/40">
                        <Mail className="w-6 h-6" />
                      </div>
                      <h4 className="text-base font-bold text-white">Reminder Dispatched</h4>
                      <p className="text-xs text-blue-300 mt-1">
                        Recovery reminder action has been recorded for <span className="font-semibold text-white">{transaction.customerName}</span>.
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Transaction ID</span>
                        <span className="font-mono text-slate-200">{result.transactionId || transaction.transactionId || transaction.id}</span>
                      </div>
                      {result.recoveryAttemptId && (
                        <div className="flex items-center justify-between text-slate-400">
                          <span>Recovery Attempt ID</span>
                          <span className="font-mono text-indigo-400">{result.recoveryAttemptId}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Strategy</span>
                        <span className="font-semibold text-blue-400">{result.strategy || 'SEND_REMINDER'}</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                        ℹ️ {result.details || "Reminder action recorded by RevenuePilot. Connect an SMS/email provider for external delivery."}
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleCloseModal}
                        className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                );
              }

              // 2. Result for PAYMENT_LINK action
              const rawPaymentUrl =
                result.paymentLink?.short_url ||
                result.short_url ||
                result.paymentLinkUrl ||
                result.paymentLink ||
                result.data?.paymentLink?.short_url ||
                result.data?.short_url ||
                result.data?.paymentLinkUrl ||
                result.data?.paymentLink;

              const isLinkValid = isValidRazorpayUrl(rawPaymentUrl);
              const paymentUrl = isLinkValid ? rawPaymentUrl : null;
              const paymentLinkId = result.paymentLink?.id || result.paymentLinkId || result.data?.paymentLinkId || 'Live';

              if (!paymentUrl) {
                return (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-center">
                      <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                      <h4 className="text-base font-bold text-white">Payment Link Not Created</h4>
                      <p className="text-xs text-amber-300 mt-1">
                        Razorpay did not return a valid Payment Link. No fake or placeholder URL was generated.
                      </p>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleCloseModal}
                        className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <>
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2 border border-emerald-500/40">
                      <Check className="w-6 h-6" />
                    </div>
                    <h4 className="text-base font-bold text-white">Recovery Action Executed Successfully</h4>
                    <p className="text-xs text-emerald-400 mt-1">
                      Razorpay Payment Link has been generated and dispatched to {transaction.customerName}.
                    </p>
                  </div>

                  {/* Razorpay Payment Link Box */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Razorpay Payment Link ID</span>
                      <span className="font-mono text-indigo-400">{paymentLinkId}</span>
                    </div>

                    <div className="flex items-center gap-2 rounded-lg bg-slate-950 p-2.5 border border-slate-800 text-xs font-mono text-slate-200">
                      <span className="truncate flex-1 select-all text-emerald-400">{paymentUrl}</span>
                      <button
                        onClick={() => handleCopy(paymentUrl)}
                        className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="Copy payment link"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <button
                      onClick={() => handleOpenLink(paymentUrl)}
                      className="w-full mt-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20"
                    >
                      <span>Open Razorpay Payment Link</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleCloseModal}
                      className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        )}

      </div>
    </div>
  );
}
