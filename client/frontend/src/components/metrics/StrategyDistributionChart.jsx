import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

export default function StrategyDistributionChart({ data }) {
  const chartData = data || [
    { strategy: "PAYMENT_RETRY", count: 8, amount: 68500, successRate: 75 },
    { strategy: "PAYMENT_LINK", count: 6, amount: 48200, successRate: 83 },
    { strategy: "SEND_REMINDER", count: 3, amount: 21600, successRate: 100 },
    { strategy: "STOP", count: 1, amount: 4000, successRate: 0 },
  ];

  const colors = ['#6366F1', '#3B82F6', '#10B981', '#64748B'];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 glass-panel">
      <div className="mb-4">
        <h3 className="text-base font-bold text-white">Recovery Performance by Strategy</h3>
        <p className="text-xs text-slate-400">Total volume recovered breakdown across AI recommended strategies</p>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis dataKey="strategy" stroke="#64748B" fontSize={10} tickLine={false} />
            <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0B0F19',
                borderColor: '#334155',
                borderRadius: '12px',
                color: '#F8FAFC',
                fontSize: '12px'
              }}
              formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Recovered Amount']}
            />
            <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
