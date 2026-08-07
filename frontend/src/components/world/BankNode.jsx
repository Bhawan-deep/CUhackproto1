import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Landmark, Percent, ShieldAlert } from 'lucide-react';

function BankNode({ data, selected }) {
  const bank = data?.bank || { interest_rate: 0.05, reserves: 1000000, default_rate: 0.02 };
  const ratePct = Math.round((bank.interest_rate || 0.05) * 1000) / 10;
  const defaultPct = Math.round((bank.default_rate || 0.02) * 1000) / 10;
  const reservesK = Math.round((bank.reserves || 1000000) / 1000);

  return (
    <div
      className={`px-4 py-3 rounded-2xl bg-[#0F172A]/95 border font-mono text-xs shadow-2xl transition-all duration-300 min-w-[200px] select-none ${
        selected
          ? 'border-purple-400 ring-2 ring-purple-500/40 shadow-purple-500/20'
          : 'border-purple-500/50 hover:border-purple-400/80 shadow-black/60'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-purple-400 !w-3 !h-3 !border-2 !border-slate-900" />

      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Landmark className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-white uppercase text-[11px] tracking-wider">CENTRAL BANK</div>
            <div className="text-[9px] text-purple-400/80 font-semibold">MONETARY AUTHORITY</div>
          </div>
        </div>
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
          BANK
        </span>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800/80">
          <span className="text-slate-400 text-[9px] flex items-center gap-1">
            <Percent className="w-3 h-3 text-purple-400" /> RATE
          </span>
          <span className="font-bold text-purple-300 text-xs">{ratePct}%</span>
        </div>

        <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800/80">
          <span className="text-slate-400 text-[9px] flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-amber-400" /> DEFAULTS
          </span>
          <span className="font-bold text-amber-300 text-xs">{defaultPct}%</span>
        </div>
      </div>

      <div className="mt-2 text-[9px] text-slate-400 flex justify-between border-t border-slate-800/60 pt-1.5">
        <span>Reserves:</span>
        <span className="font-bold text-purple-400">${reservesK}k</span>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-purple-400 !w-3 !h-3 !border-2 !border-slate-900" />
    </div>
  );
}

export default memo(BankNode);
