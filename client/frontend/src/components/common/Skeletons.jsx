import React from 'react';

export function MetricCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="h-3 w-24 bg-slate-800 rounded"></div>
          <div className="h-8 w-32 bg-slate-700/60 rounded mt-2"></div>
        </div>
        <div className="h-10 w-10 bg-slate-800 rounded-lg"></div>
      </div>
      <div className="mt-4 flex justify-between items-center">
        <div className="h-3 w-16 bg-slate-800 rounded"></div>
        <div className="h-3 w-20 bg-slate-800 rounded"></div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 8 }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 animate-pulse space-y-4">
      <div className="flex justify-between items-center pb-2">
        <div className="h-4 w-36 bg-slate-800 rounded"></div>
        <div className="h-4 w-24 bg-slate-800 rounded"></div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 items-center py-3 border-b border-slate-800/60">
            {Array.from({ length: cols }).map((_, j) => (
              <div
                key={j}
                className="h-3.5 bg-slate-800 rounded"
                style={{ width: `${Math.max(10, 100 / cols - 2)}%` }}
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 animate-pulse space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-y-1.5">
          <div className="h-4 w-48 bg-slate-800 rounded"></div>
          <div className="h-3 w-64 bg-slate-800/60 rounded"></div>
        </div>
        <div className="h-7 w-32 bg-slate-800 rounded-lg"></div>
      </div>
      <div className="h-64 w-full bg-slate-950/40 rounded-xl flex items-end p-4 gap-3">
        {Array.from({ length: 7 }).map((_, idx) => (
          <div
            key={idx}
            className="flex-1 bg-slate-800 rounded-t"
            style={{ height: `${25 + ((idx * 17) % 65)}%` }}
          ></div>
        ))}
      </div>
    </div>
  );
}

export function DetailsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse p-4">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div className="h-6 w-32 bg-slate-800 rounded"></div>
        <div className="h-6 w-20 bg-slate-800 rounded-full"></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 bg-slate-800/60 rounded-xl p-3"></div>
        ))}
      </div>
      <div className="h-24 bg-indigo-950/20 border border-indigo-500/20 rounded-2xl"></div>
      <div className="h-36 bg-slate-800/40 rounded-2xl"></div>
    </div>
  );
}
