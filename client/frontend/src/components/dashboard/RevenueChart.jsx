import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';

export default function RevenueChart({ data }) {
  const [timeRange, setTimeRange] = useState('7d');

  const formattedData = (data && data.length > 0) ? data : [
    { day: "Aug 28", atRisk: 0, recovered: 0 },
    { day: "Aug 29", atRisk: 0, recovered: 0 },
    { day: "Aug 30", atRisk: 0, recovered: 0 },
    { day: "Aug 31", atRisk: 0, recovered: 0 },
    { day: "Sep 01", atRisk: 0, recovered: 0 },
    { day: "Sep 02", atRisk: 0, recovered: 0 },
    { day: "Today", atRisk: 0, recovered: 0 },
  ];

  const formatCurrency = (val) => {
    if (!val || val === 0) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
    return `₹${val}`;
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 glass-panel">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-bold text-white">Revenue At Risk vs Recovered</h3>
          <p className="text-xs text-slate-400">Comparing total failed volume against autonomous AI recovery velocity</p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${timeRange === '7d' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${timeRange === '30d' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAtRisk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.35}/>
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorRecovered" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={formatCurrency} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0B0F19',
                borderColor: '#334155',
                borderRadius: '12px',
                color: '#F8FAFC',
                fontSize: '12px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
              }}
              formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, '']}
            />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: '15px', fontSize: '12px' }}
            />
            <Area
              type="monotone"
              dataKey="atRisk"
              name="Revenue At Risk"
              stroke="#EF4444"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorAtRisk)"
            />
            <Area
              type="monotone"
              dataKey="recovered"
              name="Revenue Recovered"
              stroke="#10B981"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorRecovered)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
