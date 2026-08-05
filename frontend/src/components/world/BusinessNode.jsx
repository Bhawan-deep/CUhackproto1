import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Building2, CheckCircle2, Activity, AlertTriangle, Users, TrendingDown, TrendingUp } from 'lucide-react';

export default memo(function BusinessNode({ data, selected }) {
  const health = data.health ?? 1.0;
  const healthPct = Math.round(health * 100);

  const deltaInfo = data.impactDelta; // Optional impact delta from impactTracker
  const isImpactActive = data.isImpactActive;

  let statusConfig = {
    label: "HEALTHY",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    Icon: CheckCircle2
  };

  if (health < 0.25) {
    statusConfig = {
      label: "CRITICAL",
      color: "text-rose-400",
      bg: "bg-rose-500/15",
      border: "border-rose-500/40",
      Icon: AlertTriangle
    };
  } else if (health < 0.50) {
    statusConfig = {
      label: "STRESSED",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      Icon: AlertTriangle
    };
  } else if (health < 0.75) {
    statusConfig = {
      label: "STABLE",
      color: "text-sky-400",
      bg: "bg-sky-500/10",
      border: "border-sky-500/30",
      Icon: Activity
    };
  }

  const { Icon } = statusConfig;

  return (
    <div className={`px-3.5 py-2.5 rounded-xl border transition-all duration-300 bg-[#0F172A] shadow-md min-w-[170px] ${
      selected 
        ? 'border-sky-400 ring-2 ring-sky-400/40 shadow-sky-500/20' 
        : isImpactActive
        ? 'border-amber-500/80 ring-2 ring-amber-500/40'
        : 'border-slate-800 hover:border-slate-600'
    }`}>
      <Handle type="target" position={Position.Top} className="!bg-sky-400 !w-2 !h-2 !border-2 !border-slate-900" />
      
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-semibold text-xs text-slate-100 truncate">{data.name}</span>
        </div>
        <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase font-bold flex items-center gap-1 shrink-0 ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}>
          <Icon className="w-2.5 h-2.5" />
          {statusConfig.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono text-slate-400">
        <div>
          <span className="text-slate-500 block text-[8px]">HEALTH</span>
          <span className={`font-bold ${statusConfig.color}`}>{healthPct}%</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[8px]">EMPLOYEES</span>
          <span className="text-slate-200 font-bold flex items-center gap-0.5">
            <Users className="w-2.5 h-2.5 text-slate-400" />
            {data.employee_count}
          </span>
        </div>
      </div>

      {/* Impact Mode Delta Badges */}
      {isImpactActive && deltaInfo && (
        <div className="mt-1.5 pt-1.5 border-t border-slate-800 flex items-center justify-between text-[8px] font-mono">
          <span className="text-slate-400">IMPACT:</span>
          {deltaInfo.health?.delta !== undefined && (
            <span className={`font-bold flex items-center gap-0.5 ${deltaInfo.health.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {deltaInfo.health.delta >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
              {deltaInfo.health.delta >= 0 ? '+' : ''}{Math.round(deltaInfo.health.delta * 100)}%
            </span>
          )}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !w-2 !h-2 !border-2 !border-slate-900" />
    </div>
  );
});
