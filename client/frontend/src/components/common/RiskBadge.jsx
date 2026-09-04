import React from 'react';
import { AlertTriangle, AlertCircle, ShieldCheck } from 'lucide-react';

export default function RiskBadge({ score, level, showIcon = true, size = "md" }) {
  // Standardized styling per design system
  let bgColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  let Icon = ShieldCheck;

  if (level === 'HIGH' || score >= 75) {
    bgColor = "bg-rose-500/10 text-rose-400 border-rose-500/20";
    Icon = AlertTriangle;
  } else if (level === 'MEDIUM' || (score >= 45 && score < 75)) {
    bgColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
    Icon = AlertCircle;
  }

  const py = size === "sm" ? "py-0.5 px-2 text-xs" : "py-1 px-2.5 text-xs font-medium";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${bgColor} ${py}`}>
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{level || (score >= 75 ? 'HIGH' : score >= 45 ? 'MEDIUM' : 'LOW')}</span>
      {score !== undefined && <span className="font-semibold">{score}%</span>}
    </span>
  );
}
