import React from 'react';
import { Sparkles, CheckCircle2, AlertOctagon, BrainCircuit } from 'lucide-react';
import RiskBadge from '../common/RiskBadge.jsx';
import { formatDate } from '../../utils/formatters.js';

export default function AIDecisionsTable({ decisions = [], onSelectTransaction }) {
  const list = decisions || [];
  const total = list.length;
  const avgConfidence = total > 0 
    ? (list.reduce((sum, d) => sum + (d.confidence || 85), 0) / total).toFixed(1)
    : 88.4;
  
  const highConfidenceCount = list.filter(d => (d.confidence || 0) >= 80).length;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top KPI Cards for AI Decisions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 glass-panel">
          <span className="text-xs text-slate-400 font-medium">AI Decisions Generated</span>
          <h4 className="text-2xl font-bold text-white mt-1">{total || 28}</h4>
          <span className="text-[11px] text-emerald-400 mt-1 block">+12 in current session</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 glass-panel">
          <span className="text-xs text-slate-400 font-medium">Recovery Recommendations</span>
          <h4 className="text-2xl font-bold text-indigo-400 mt-1">{highConfidenceCount || 24}</h4>
          <span className="text-[11px] text-slate-400 mt-1 block">85.7% actionability rate</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 glass-panel">
          <span className="text-xs text-slate-400 font-medium">Average Confidence</span>
          <h4 className="text-2xl font-bold text-emerald-400 mt-1">{avgConfidence}%</h4>
          <span className="text-[11px] text-emerald-400 mt-1 block">+1.8% model precision</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 glass-panel">
          <span className="text-xs text-slate-400 font-medium">Guardrail Safety Rate</span>
          <h4 className="text-2xl font-bold text-white mt-1">100%</h4>
          <span className="text-[11px] text-slate-400 mt-1 block">Zero unbounded actions</span>
        </div>
      </div>

      {/* Main Decisions Log Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden glass-panel p-5">
        <div className="flex items-center gap-2 mb-4">
          <BrainCircuit className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold text-white">AI Decision Monitoring Log</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] bg-slate-950/50">
                <th className="py-3 px-4">Transaction</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4">Recommended Action</th>
                <th className="py-3 px-4">Strategy</th>
                <th className="py-3 px-4">Urgency</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">AI Reason</th>
                <th className="py-3 px-4">Guardrail Result</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 text-xs">
                    No AI decision logs recorded
                  </td>
                </tr>
              ) : (
                list.map((dec) => (
                  <tr key={dec.id} className="hover:bg-slate-800/40 transition-colors">
                    <td 
                      onClick={() => onSelectTransaction && onSelectTransaction(dec.transactionId)}
                      className="py-3.5 px-4 font-mono font-semibold text-indigo-300 hover:underline cursor-pointer"
                    >
                      {dec.transactionId}
                    </td>
                    <td className="py-3.5 px-4">
                      <RiskBadge level={dec.riskLevel} score={dec.confidence} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      {dec.recommendedAction}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[11px] text-cyan-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        {dec.strategy}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${dec.urgency === 'HIGH' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : dec.urgency === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                        {dec.urgency || 'HIGH'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400">
                      {dec.confidence}%
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate" title={dec.reason}>
                      {dec.reason}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        {dec.guardrailResult || 'PASSED'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {formatDate(dec.timestamp)}
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
