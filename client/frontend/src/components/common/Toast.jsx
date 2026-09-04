import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose, duration = 4000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const styles = {
    success: 'bg-slate-900 border-emerald-500/40 text-emerald-300 shadow-emerald-950/40',
    error: 'bg-slate-900 border-rose-500/40 text-rose-300 shadow-rose-950/40',
    info: 'bg-slate-900 border-indigo-500/40 text-indigo-300 shadow-indigo-950/40',
  }[type] || 'bg-slate-900 border-indigo-500/40 text-indigo-300';

  const Icon = type === 'success' ? CheckCircle2 : type === 'error' ? XCircle : AlertCircle;

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-bounce-subtle">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border glass-panel shadow-xl ${styles}`}>
        <Icon className="w-5 h-5 shrink-0" />
        <span className="text-xs font-semibold text-white">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
