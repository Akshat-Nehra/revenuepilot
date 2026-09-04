import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Sparkles, 
  ShieldCheck, 
  Play, 
  CreditCard, 
  CheckCircle2, 
  Webhook, 
  TrendingUp, 
  Search,
  Clock,
  XCircle,
  StopCircle
} from 'lucide-react';
import { formatDate } from '../../utils/formatters.js';

export default function AuditTimeline({ auditLogs = [] }) {
  const [search, setSearch] = useState('');

  const getEventIcon = (event = '') => {
    const ev = event.toUpperCase();
    if (ev.includes('RISK_DETECTED') || ev.includes('DETECTED')) {
      return { icon: AlertTriangle, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
    }
    if (ev.includes('AI_RECOMMENDATION') || ev.includes('RECOMMENDATION')) {
      return { icon: Sparkles, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' };
    }
    if (ev.includes('GUARDRAIL')) {
      return { icon: ShieldCheck, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    }
    if (ev.includes('ATTEMPT_CREATED') || ev.includes('EXECUTED')) {
      return { icon: Play, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
    }
    if (ev.includes('PAYMENT_LINK')) {
      return { icon: CreditCard, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' };
    }
    if (ev.includes('PAYMENT_PENDING')) {
      return { icon: Clock, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    }
    if (ev.includes('PAYMENT_CAPTURED') || ev.includes('RECEIVED')) {
      return { icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    }
    if (ev.includes('WEBHOOK')) {
      return { icon: Webhook, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' };
    }
    if (ev.includes('REVENUE_RECOVERED') || ev.includes('RECOVERED')) {
      return { icon: TrendingUp, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    }
    if (ev.includes('FAILED')) {
      return { icon: XCircle, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
    }
    if (ev.includes('STOPPED')) {
      return { icon: StopCircle, color: 'text-slate-400 bg-slate-800 border-slate-700' };
    }

    return { icon: Sparkles, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' };
  };

  const logs = (auditLogs || []).filter(l =>
    !search ||
    l.transactionId?.toLowerCase().includes(search.toLowerCase()) ||
    l.event?.toLowerCase().includes(search.toLowerCase()) ||
    l.actor?.toLowerCase().includes(search.toLowerCase()) ||
    l.details?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 glass-panel space-y-6 animate-fade-in">
      
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-white">Immutable Audit Trail</h3>
          <p className="text-xs text-slate-400">Complete, chronological event log of AI decisions, guardrails, and Razorpay webhook receipts</p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events, actor, TXN ID..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Vertical Timeline */}
      {logs.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-xs">
          No audit log records found
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
          {logs.map((log) => {
            const { icon: Icon, color } = getEventIcon(log.event);
            return (
              <div key={log.id} className="relative group">
                
                {/* Timeline Icon Node */}
                <div className={`absolute -left-6 top-0 flex items-center justify-center w-6 h-6 rounded-full border shadow-md ${color}`}>
                  <Icon className="w-3 h-3" />
                </div>

                {/* Event Content Box */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 hover:border-slate-700 transition-all space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-400">{log.transactionId}</span>
                      <h4 className="text-xs font-bold text-white font-mono">{log.event}</h4>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono whitespace-nowrap">
                      {formatDate(log.timestamp)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
                    <span>Actor: <strong className="text-slate-200">{log.actor}</strong></span>
                    <span>•</span>
                    <span>Decision: <strong className="text-indigo-300 font-mono">{log.decision}</strong></span>
                    <span>•</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold text-[10px]">
                      {log.status}
                    </span>
                  </div>

                  {log.details && (
                    <p className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60 font-mono text-[11px] leading-relaxed">
                      {log.details}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
