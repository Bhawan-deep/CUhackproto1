import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { UserCheck, Smile, TrendingDown, TrendingUp } from 'lucide-react';

export default memo(function CitizenGroupNode({ data, selected }) {
  const count = data.count || 0;
  const empCount = data.employed_count || 0;
  const empPct = count > 0 ? Math.round((empCount / count) * 100) : 0;
  const satPct = Math.round((data.average_satisfaction || 0) * 100);

  const deltaInfo = data.impactDelta;
  const isImpactActive = data.isImpactActive;

  return (
    <div className={`px-3 py-2 rounded-xl border transition-all duration-300 bg-[#0B132B] shadow-md min-w-[160px] ${
      selected 
        ? 'border-sky-400 ring-2 ring-sky-400/40 shadow-sky-500/20' 
        : isImpactActive
        ? 'border-amber-500/80 ring-2 ring-amber-500/40'
        : 'border-slate-800 hover:border-slate-600'
    }`}>
      <Handle type="target" position={Position.Top} className="!bg-slate-400 !w-2 !h-2 !border-2 !border-slate-900" />
      
      <div className="flex items-center justify-between gap-1 mb-1 border-b border-slate-800/80 pb-1">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <UserCheck className="w-3 h-3 text-sky-400 shrink-0" />
          <span className="font-semibold text-xs text-slate-200 truncate">{data.occupation}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1 text-[9px] font-mono">
        <div>
          <span className="text-slate-500 block text-[8px]">EMPLOYED</span>
          <span className="text-emerald-400 font-semibold">{empCount}/{count} ({empPct}%)</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[8px]">SATISFACTION</span>
          <span className="text-amber-300 font-semibold flex items-center gap-0.5">
            <Smile className="w-2.5 h-2.5 text-amber-400" />
            {satPct}%
          </span>
        </div>
      </div>

      {/* Impact Mode Delta Badges */}
      {isImpactActive && deltaInfo && (
        <div className="mt-1 pt-1 border-t border-slate-800/80 flex items-center justify-between text-[8px] font-mono">
          <span className="text-slate-400">IMPACT:</span>
          {deltaInfo.employedCount?.delta !== undefined && (
            <span className={`font-bold flex items-center gap-0.5 ${deltaInfo.employedCount.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {deltaInfo.employedCount.delta >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
              {deltaInfo.employedCount.delta >= 0 ? '+' : ''}{deltaInfo.employedCount.delta} emp
            </span>
          )}
        </div>
      )}
    </div>
  );
});
