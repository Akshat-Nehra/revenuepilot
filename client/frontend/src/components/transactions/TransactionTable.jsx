import React, { useState } from 'react';
import { Search, Filter, Eye, Play, CheckCircle, AlertTriangle } from 'lucide-react';
import RiskBadge from '../common/RiskBadge.jsx';
import StatusBadge from '../common/StatusBadge.jsx';
import { formatCurrency, formatDate } from '../../utils/formatters.js';

export default function TransactionTable({ transactions, onSelectTransaction, onExecuteRecovery }) {
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');

  const tabs = ['All', 'High Risk', 'Medium Risk', 'Low Risk', 'Eligible', 'Recovered', 'Pending', 'Failed'];

  const filtered = (transactions || []).filter(t => {
    if (!t) return false;
    // Search match
    const query = (search || '').toLowerCase().trim();
    const matchesSearch = !query || (
      (t.id && String(t.id).toLowerCase().includes(query)) ||
      (t.transactionId && String(t.transactionId).toLowerCase().includes(query)) ||
      (t.customerName && String(t.customerName).toLowerCase().includes(query)) ||
      (t.customerEmail && String(t.customerEmail).toLowerCase().includes(query)) ||
      (t.failureReason && String(t.failureReason).toLowerCase().includes(query))
    );

    if (!matchesSearch) return false;

    // Tab match
    if (activeTab === 'All') return true;
    if (activeTab === 'High Risk') return t.riskLevel === 'HIGH' || (t.riskScore >= 75);
    if (activeTab === 'Medium Risk') return t.riskLevel === 'MEDIUM' || (t.riskScore >= 45 && t.riskScore < 75);
    if (activeTab === 'Low Risk') return t.riskLevel === 'LOW' || (t.riskScore < 45);
    if (activeTab === 'Eligible') return t.eligibilityStatus === 'ELIGIBLE' || t.recoveryState === 'ELIGIBLE';
    if (activeTab === 'Recovered') return t.status === 'Recovered' || t.recoveryState === 'RECOVERED';
    if (activeTab === 'Pending') return t.status === 'Pending' || t.recoveryState === 'PENDING';
    if (activeTab === 'Failed') return t.status === 'Failed' || t.recoveryState === 'FAILED';

    return true;
  });

  return (
    <div className="space-y-4">
      {/* Controls Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, customer, email, reason..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden glass-panel">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] bg-slate-950/50">
                <th className="py-3.5 px-4">Transaction ID</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Failure Reason</th>
                <th className="py-3.5 px-4">Risk Score</th>
                <th className="py-3.5 px-4">Eligibility</th>
                <th className="py-3.5 px-4">Recovery State</th>
                <th className="py-3.5 px-4">Created At</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 text-xs">
                    No transactions found matching your filter criteria
                  </td>
                </tr>
              ) : (
                filtered.map((txn) => (
                  <tr key={txn.id} className="hover:bg-slate-800/40 transition-colors">
                    <td 
                      onClick={() => onSelectTransaction(txn)}
                      className="py-3.5 px-4 font-mono font-semibold text-indigo-300 hover:underline cursor-pointer"
                    >
                      {txn.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-white">{txn.customerName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{txn.customerEmail}</p>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400">
                      {formatCurrency(txn.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px]">
                        {txn.failureReason}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <RiskBadge level={txn.riskLevel} score={txn.riskScore} size="sm" />
                        <div className="w-12 h-1.5 rounded-full bg-slate-800 overflow-hidden hidden sm:block">
                          <div
                            className={`h-full rounded-full ${txn.riskScore >= 75 ? 'bg-rose-500' : txn.riskScore >= 45 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${txn.riskScore}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle className="w-3 h-3" />
                        {txn.eligibilityStatus || 'ELIGIBLE'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={txn.recoveryState || txn.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {formatDate(txn.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {txn.status === 'Pending' && (
                          <button
                            onClick={() => onExecuteRecovery(txn)}
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] flex items-center gap-1 shadow-sm transition-all"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Execute</span>
                          </button>
                        )}
                        <button
                          onClick={() => onSelectTransaction(txn)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors border border-slate-700"
                        >
                          View Details
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
    </div>
  );
}
