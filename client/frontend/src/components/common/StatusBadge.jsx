import React from 'react';
import { CheckCircle2, Clock, XCircle, StopCircle, Mail } from 'lucide-react';

export default function StatusBadge({ status, size = "md" }) {
  let styles = "bg-slate-800 text-slate-300 border-slate-700";
  let Icon = Clock;

  const normalized = (status || '').toLowerCase().replace(/_/g, ' ');

  if (normalized === 'recovered') {
    styles = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    Icon = CheckCircle2;
  } else if (normalized === 'pending') {
    styles = "bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse-subtle";
    Icon = Clock;
  } else if (normalized === 'reminder sent' || normalized === 'reminder_sent') {
    styles = "bg-blue-500/10 text-blue-400 border-blue-500/30";
    Icon = Mail;
  } else if (normalized === 'failed') {
    styles = "bg-rose-500/10 text-rose-400 border-rose-500/30";
    Icon = XCircle;
  } else if (normalized === 'stopped') {
    styles = "bg-slate-700/30 text-slate-400 border-slate-700";
    Icon = StopCircle;
  }

  const padding = size === 'sm' ? 'py-0.5 px-2 text-xs' : 'py-1 px-2.5 text-xs font-semibold';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${styles} ${padding}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span className="capitalize">{normalized}</span>
    </span>
  );
}
