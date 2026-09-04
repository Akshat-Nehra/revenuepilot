import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

export default function FailureReasonChart({ data }) {
  const chartData = data || [
    { name: "Insufficient Funds", value: 112000 },
    { name: "Bank Server Down", value: 78000 },
    { name: "Card Expired", value: 45000 },
    { name: "Authentication Failed", value: 34500 },
    { name: "Network Timeout", value: 15000 },
  ];

  const COLORS = ['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#10B981'];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 glass-panel">
      <div className="mb-2">
        <h3 className="text-base font-bold text-white">Revenue At Risk by Failure Reason</h3>
        <p className="text-xs text-slate-400">Categorized payment decline sources</p>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#0B0F19',
                borderColor: '#334155',
                borderRadius: '12px',
                color: '#F8FAFC',
                fontSize: '12px'
              }}
              formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'At Risk']}
            />
            <Legend
              verticalAlign="bottom"
              align="center"
              iconType="circle"
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
