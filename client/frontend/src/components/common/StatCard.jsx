import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ title, value, change, trend = 'up', icon: Icon, accentColor = 'blue', subtitle }) {
  const accentGlow = {
    blue: 'from-blue-500/10 to-indigo-500/5 border-blue-500/20 text-blue-400',
    emerald: 'from-emerald-500/10 to-teal-500/5 border-emerald-500/20 text-emerald-400',
    purple: 'from-purple-500/10 to-indigo-500/5 border-purple-500/20 text-purple-400',
    amber: 'from-amber-500/10 to-orange-500/5 border-amber-500/20 text-amber-400',
    rose: 'from-rose-500/10 to-red-500/5 border-rose-500/20 text-rose-400',
  }[accentColor] || 'from-indigo-500/10 to-blue-500/5 border-indigo-500/20 text-indigo-400';

  return (
    <div className={`relative overflow-hidden rounded-xl border bg-gradient-to-br p-5 backdrop-blur-md transition-all duration-300 hover:border-slate-700 glass-panel ${accentGlow}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight text-white">{value}</h3>
        </div>
        {Icon && (
          <div className="rounded-lg p-2.5 bg-slate-900/60 border border-slate-800 text-slate-300">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        {change && (
          <div className="flex items-center gap-1">
            <span className={`inline-flex items-center text-xs font-semibold ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trend === 'up' ? <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> : <TrendingDown className="w-3.5 h-3.5 mr-0.5" />}
              {change}
            </span>
            <span className="text-xs text-slate-500">vs last 30d</span>
          </div>
        )}
        {subtitle && (
          <span className="text-xs text-slate-400 font-medium">{subtitle}</span>
        )}
      </div>
    </div>
  );
}
