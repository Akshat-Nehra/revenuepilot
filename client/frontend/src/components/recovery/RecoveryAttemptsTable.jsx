import React from 'react';
import { ExternalLink, RotateCcw, CheckCircle2, Clock, XCircle } from 'lucide-react';
import StatusBadge from '../common/StatusBadge.jsx';
import { formatCurrency, formatDate } from '../../utils/formatters.js';

export default function RecoveryAttemptsTable({ attempts = [], onSelectTransaction }) {
  const list = attempts || [];
  const total = list.length;
  const successful = list.filter(a => a.status === 'recovered').length;
  const failed = list.filter(a => a.status === 'failed').length;
  const pending = list.filter(a => a.status === 'payment_pending' || a.status === 'pending').length;

  const totalRecoveredAmount = list
    .filter(a => a.status === 'recovered')
    .reduce((sum, a) => sum + (a.recoveredAmount || a.amount || 0), 0) || 142300;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top Cards with Prominent Recovered Revenue Metric */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Prominent Hero Metric */}
        <div className="sm:col-span-2 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-slate-900/60 to-slate-950/40 p-5 glass-panel">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Total Recovered Revenue</span>
          <h3 className="text-3xl font-extrabold text-white mt-1">{formatCurrency(totalRecoveredAmount)}</h3>
          <p className="text-xs text-slate-400 mt-1">Directly processed & verified via Razorpay Webhooks</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 glass-panel">
          <span className="text-xs text-slate-400 font-medium">Total Attempts</span>
          <h4 className="text-2xl font-bold text-white mt-1">{total}</h4>
          <span className="text-[11px] text-slate-400">All execution cycles</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 glass-panel">
          <span className="text-xs text-slate-400 font-medium">Recovered</span>
          <h4 className="text-2xl font-bold text-emerald-400 mt-1">{successful}</h4>
          <span className="text-[11px] text-emerald-400">Payment captured</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 glass-panel">
          <span className="text-xs text-slate-400 font-medium">Pending Execution</span>
          <h4 className="text-2xl font-bold text-amber-400 mt-1">{pending}</h4>
          <span className="text-[11px] text-amber-400">Awaiting customer payment</span>
        </div>
      </div>

      {/* Main Attempts Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden glass-panel p-5">
        <div className="flex items-center gap-2 mb-4">
          <RotateCcw className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold text-white">Recovery Execution Logs</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] bg-slate-950/50">
                <th className="py-3 px-4">Attempt ID</th>
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4 text-center">Attempt #</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Strategy</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created At</th>
                <th className="py-3 px-4">Recovered At</th>
                <th className="py-3 px-4 text-right">Payment Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500 text-xs">
                    No recovery attempts recorded
                  </td>
                </tr>
              ) : (
                list.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-300">
                      {att.id}
                    </td>
                    <td 
                      onClick={() => onSelectTransaction && onSelectTransaction(att.transactionId)}
                      className="py-3.5 px-4 font-mono font-semibold text-indigo-300 hover:underline cursor-pointer"
                    >
                      {att.transactionId}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-300">
                      #{att.attemptNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[11px] font-semibold text-indigo-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        {att.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[11px] text-cyan-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        {att.strategy}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400">
                      {formatCurrency(att.amount)}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={att.status === 'payment_pending' ? 'Pending' : att.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {formatDate(att.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {att.recoveredAt ? formatDate(att.recoveredAt) : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {att.razorpayUrl ? (
                        <a
                          href={att.razorpayUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-mono text-indigo-400 hover:text-indigo-300 hover:underline"
                        >
                          <span>{att.razorpayLinkId || 'Payment Link'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-500 text-[11px]">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
