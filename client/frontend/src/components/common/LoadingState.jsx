import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingState({ title = "Loading RevenuePilot data..." }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-3 min-h-[300px]">
      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      <p className="text-xs font-medium text-slate-400">{title}</p>
    </div>
  );
}
