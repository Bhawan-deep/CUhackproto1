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
      className={`px-4 py-3 rounded-xl bg-[#0F172A] border font-mono text-xs shadow-lg transition-all duration-300 min-w-[200px] select-none ${
        selected
          ? 'border-sky-400 ring-2 ring-sky-400/40 shadow-sky-500/20'
          : 'border-slate-800 hover:border-slate-600 shadow-slate-950/60'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-sky-400 !w-2.5 !h-2.5 !border-2 !border-slate-900" />

      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Landmark className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-white uppercase text-[11px] tracking-wider">CENTRAL BANK</div>
            <div className="text-[9px] text-sky-400/80 font-semibold">MONETARY AUTHORITY</div>
          </div>
        </div>
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 font-bold border border-sky-800">
          BANK
        </span>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
          <span className="text-slate-500 text-[9px] flex items-center gap-1">
            <Percent className="w-3 h-3 text-sky-400" /> RATE
          </span>
          <span className="font-bold text-sky-300 text-xs">{ratePct}%</span>
        </div>

        <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
          <span className="text-slate-500 text-[9px] flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-amber-400" /> DEFAULTS
          </span>
          <span className="font-bold text-amber-300 text-xs">{defaultPct}%</span>
        </div>
      </div>

      <div className="mt-2 text-[9px] text-slate-400 flex justify-between border-t border-slate-800/80 pt-1.5">
        <span>Reserves:</span>
        <span className="font-bold text-sky-400">${reservesK}k</span>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-sky-400 !w-2.5 !h-2.5 !border-2 !border-slate-900" />
    </div>
  );
}

export default memo(BankNode);
