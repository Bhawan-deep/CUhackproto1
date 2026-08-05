import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Landmark, ShieldAlert, DollarSign, Award } from 'lucide-react';

export default memo(function GovernmentNode({ data, selected }) {
  const taxPct = (data.tax_rate * 100).toFixed(0);
  const infraStr = (data.infrastructure_spending / 1000).toFixed(0);
  const treasuryStr = (data.treasury / 1000).toFixed(0);
  const satPct = (data.public_satisfaction * 100).toFixed(0);

  return (
    <div className={`px-4 py-3 rounded-xl border transition-all duration-300 bg-[#0F172A] shadow-lg min-w-[220px] ${
      selected 
        ? 'border-sky-400 ring-2 ring-sky-400/40 shadow-sky-500/20' 
        : 'border-slate-700 hover:border-slate-500'
    }`}>
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Landmark className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-white uppercase tracking-wider">Government</h3>
            <span className="text-[9px] text-slate-400 font-mono">STATE REGULATOR</span>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
          Tax {taxPct}%
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
        <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
          <span className="text-slate-500 block text-[9px]">INFRA SPEND</span>
          <span className="text-slate-200 font-semibold">${infraStr}k/mo</span>
        </div>
        <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
          <span className="text-slate-500 block text-[9px]">TREASURY</span>
          <span className="text-emerald-400 font-semibold">${treasuryStr}k</span>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-400 bg-slate-900/50 px-2 py-1 rounded">
        <span>PUBLIC SATISFACTION</span>
        <span className="text-sky-300 font-bold">{satPct}%</span>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-sky-400 !w-2.5 !h-2.5 !border-2 !border-slate-900" />
    </div>
  );
});
