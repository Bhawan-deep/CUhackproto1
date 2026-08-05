import React from 'react';
import { History, Clock, Landmark, Zap } from 'lucide-react';

export default function InterventionHistory({ history }) {
  if (!history || history.length === 0) {
    return (
      <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 text-[11px] text-slate-500 font-mono text-center">
        No interventions recorded for this session.
      </div>
    );
  }

  return (
    <div className="space-y-2 font-mono text-xs">
      <div className="flex items-center gap-1.5 text-slate-400 font-bold border-b border-slate-800 pb-1">
        <History className="w-3.5 h-3.5 text-sky-400" />
        <span className="uppercase text-[10px]">Intervention History ({history.length})</span>
      </div>

      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {history.map((item, index) => {
          const isPolicy = item.type === 'policy';
          return (
            <div
              key={index}
              className="p-2 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between text-[11px]"
            >
              <div className="flex items-center gap-2">
                {isPolicy ? (
                  <Landmark className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                ) : (
                  <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                )}
                <div>
                  <span className="font-bold text-slate-200 block">{item.name}</span>
                  <span className="text-[9px] text-slate-400">{item.detail}</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-400 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                M{item.appliedTick}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
