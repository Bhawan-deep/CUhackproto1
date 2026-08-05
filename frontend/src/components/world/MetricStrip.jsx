import React from 'react';
import { Users, TrendingUp, ShieldAlert, Heart, Building2 } from 'lucide-react';

export default function MetricStrip({ metrics }) {
  const empRate = metrics ? (metrics.employment_rate * 100).toFixed(1) : '--';
  const outputStr = metrics ? `$${Math.round(metrics.economic_output).toLocaleString()}` : '--';
  const giniStr = metrics ? metrics.inequality.toFixed(3) : '--';
  const satStr = metrics ? `${(metrics.public_satisfaction * 100).toFixed(1)}%` : '--';
  const healthStr = metrics ? `${(metrics.business_health * 100).toFixed(1)}%` : '--';

  return (
    <div className="bg-[#0B132B]/90 border-b border-slate-800/80 px-6 py-2 flex items-center justify-between gap-4 overflow-x-auto text-xs font-mono">
      <div className="flex items-center gap-6">
        {/* EMPLOYMENT */}
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-slate-400 text-[10px]">EMPLOYMENT:</span>
          <span className="font-bold text-emerald-400">{empRate}%</span>
        </div>

        {/* OUTPUT */}
        <div className="flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span className="text-slate-400 text-[10px]">OUTPUT:</span>
          <span className="font-bold text-slate-200">{outputStr}</span>
        </div>

        {/* INEQUALITY */}
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-slate-400 text-[10px]">INEQUALITY (GINI):</span>
          <span className="font-bold text-amber-400">{giniStr}</span>
        </div>

        {/* SATISFACTION */}
        <div className="flex items-center gap-2">
          <Heart className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span className="text-slate-400 text-[10px]">SATISFACTION:</span>
          <span className="font-bold text-sky-300">{satStr}</span>
        </div>

        {/* BUSINESS HEALTH */}
        <div className="flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-slate-400 text-[10px]">BIZ HEALTH:</span>
          <span className="font-bold text-emerald-300">{healthStr}</span>
        </div>
      </div>
    </div>
  );
}
