import React from 'react';
import { Eye, Play } from 'lucide-react';
import RiskBadge from '../common/RiskBadge.jsx';
import StatusBadge from '../common/StatusBadge.jsx';
import { formatCurrency, formatDate } from '../../utils/formatters.js';

export default function RecentActivityTable({ transactions = [], onSelectTransaction, onExecuteRecovery }) {
  const displayList = (transactions || []).slice(0, 6);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 glass-panel animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white">Recent At-Risk Activity</h3>
          <p className="text-xs text-slate-400">Stream of detected at-risk payments and AI decisions</p>
        </div>
        <span 
          className="text-xs font-semibold text-indigo-400 hover:underline cursor-pointer" 
          onClick={() => onSelectTransaction(null)}
        >
          View All Transactions →
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] bg-slate-950/40">
              <th className="py-3 px-3">Transaction</th>
              <th className="py-3 px-3">Customer</th>
              <th className="py-3 px-3">Amount</th>
              <th className="py-3 px-3">Risk</th>
              <th className="py-3 px-3">AI Action</th>
              <th className="py-3 px-3 text-center">Attempt</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">Time</th>
              <th className="py-3 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {displayList.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500 text-xs">
                  No recent activity recorded
                </td>
              </tr>
            ) : (
              displayList.map((txn) => (
                <tr 
                  key={txn.id}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  <td 
                    onClick={() => onSelectTransaction(txn)}
                    className="py-3.5 px-3 font-mono font-semibold text-indigo-300 hover:underline cursor-pointer"
                  >
                    {txn.id}
                  </td>
                  <td className="py-3.5 px-3">
                    <p className="font-semibold text-white">{txn.customerName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{txn.customerEmail}</p>
                  </td>
                  <td className="py-3.5 px-3 font-bold text-emerald-400">
                    {formatCurrency(txn.amount)}
                  </td>
                  <td className="py-3.5 px-3">
                    <RiskBadge level={txn.riskLevel} score={txn.riskScore} size="sm" />
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="font-mono text-[11px] font-medium text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      {txn.aiRecommendation?.action || "PAYMENT_RETRY"}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono font-semibold text-slate-300">
                    #{txn.attemptsCount || 1}
                  </td>
                  <td className="py-3.5 px-3">
                    <StatusBadge status={txn.recoveryState || txn.status} size="sm" />
                  </td>
                  <td className="py-3.5 px-3 text-slate-400 whitespace-nowrap">
                    {formatDate(txn.createdAt)}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {txn.status === 'Pending' && (
                        <button
                          onClick={() => onExecuteRecovery(txn)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] flex items-center gap-1 shadow-sm transition-all"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Execute</span>
                        </button>
                      )}
                      <button
                        onClick={() => onSelectTransaction(txn)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium transition-colors border border-slate-700"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
