import React from 'react';
import { ArrowRight, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

export default function InterventionPropagationView({ interventionInfo, appliedTick, currentTick }) {
  if (!interventionInfo) return null;

  const startTick = appliedTick || 0;
  const elapsed = currentTick - startTick;

  const stages = [
    { offset: 0, title: 'Direct Effects', desc: 'Policy parameter or external shock enters simulation engine state.' },
    { offset: 1, title: 'First-Order Effects', desc: 'Business revenue expectations and borrowing conditions adapt.' },
    { offset: 2, title: 'Secondary Effects', desc: 'Corporate workforce hiring/firing decisions take effect.' },
    { offset: 3, title: 'Emergent Macro Effects', desc: 'Employment rates, citizen income, and tax collection adjust.' }
  ];

  return (
    <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 font-mono text-xs space-y-3 shadow-xl">
      <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-amber-200 text-xs uppercase">
            INTERVENTION PROPAGATION TRACKER — Month {startTick}
          </span>
        </div>
        <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold text-[10px]">
          +{elapsed} Ticks Elapsed
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        {stages.map((st, idx) => {
          const isReached = elapsed >= st.offset;
          const isCurrent = elapsed === st.offset;

          return (
            <div
              key={idx}
              className={`p-3 rounded-xl border transition-all duration-300 ${
                isCurrent
                  ? 'bg-amber-500/20 border-amber-400 text-amber-100 ring-2 ring-amber-400/40'
                  : isReached
                  ? 'bg-slate-900/90 border-slate-800 text-slate-300'
                  : 'bg-slate-950/60 border-slate-900 text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="font-bold uppercase">M{startTick + st.offset}</span>
                {isReached ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Clock className="w-3.5 h-3.5" />}
              </div>
              <div className="font-bold text-xs mb-1">{st.title}</div>
              <p className="text-[10px] leading-snug">{st.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
