import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({ title = "No transactions found", message = "No records match your selected filter criteria." }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/30 my-6">
      <div className="rounded-full p-3 bg-slate-800 text-slate-500 mb-3">
        <Inbox className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-semibold text-white">{title}</h4>
      <p className="text-xs text-slate-400 mt-1">{message}</p>
    </div>
  );
}
