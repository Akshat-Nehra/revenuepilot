import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

export default function ErrorState({ title = "Failed to load data", message = "Unable to connect to RevenuePilot backend. Please check network or retry.", onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-rose-500/20 bg-rose-500/5 text-center my-6">
      <div className="rounded-full p-3 bg-rose-500/10 text-rose-400 mb-3 border border-rose-500/20">
        <AlertOctagon className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-bold text-white">{title}</h4>
      <p className="text-xs text-slate-400 max-w-md mt-1 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors border border-slate-700"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Request</span>
        </button>
      )}
    </div>
  );
}
