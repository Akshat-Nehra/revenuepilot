import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function RecoveryRateChart({ data }) {
  const chartData = [
    { date: "Aug 28", rate: 42.8 },
    { date: "Aug 29", rate: 45.1 },
    { date: "Aug 30", rate: 44.0 },
    { date: "Aug 31", rate: 47.5 },
    { date: "Sep 01", rate: 48.2 },
    { date: "Sep 02", rate: 49.0 },
    { date: "Sep 03", rate: 50.0 },
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 glass-panel">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white">Recovery Rate Trend (%)</h3>
          <p className="text-xs text-slate-400">Percentage of failed payments successfully recovered</p>
        </div>
        <span className="text-sm font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          50.0% Current Rate
        </span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748B" fontSize={11} tickLine={false} domain={[30, 60]} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0B0F19',
                borderColor: '#334155',
                borderRadius: '12px',
                color: '#F8FAFC',
                fontSize: '12px'
              }}
              formatter={(val) => [`${val}%`, 'Recovery Rate']}
            />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="#10B981"
              strokeWidth={3}
              dot={{ fill: '#10B981', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
