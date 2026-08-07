import React from 'react';
import { Split, GitBranch, ArrowRight, ShieldAlert, Award } from 'lucide-react';

export default function DivergenceTraceView({ experimentResult }) {
  if (!experimentResult) return null;

  const macroComp = experimentResult.macro_comparison || {};
  const topDiverging = experimentResult.top_diverging_businesses || [];
  const sourceTick = experimentResult.source_tick || 0;
  const config = experimentResult.configuration || {};

  return (
    <div className="p-5 rounded-2xl bg-[#0F172A]/95 border border-purple-500/40 font-mono text-xs space-y-4 shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white uppercase tracking-wider">
              WHY DID THE UNIVERSES DIVERGE?
            </h3>
            <span className="text-[10px] text-purple-400 font-semibold">
              PARALLEL UNIVERSE COUNTERFACTUAL EXPLANATION
            </span>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded bg-purple-500 text-slate-950 font-bold text-xs">
          FORK POINT: M{sourceTick}
        </span>
      </div>

      {/* Divergence Timeline Steps */}
      <div className="space-y-2">
        <span className="text-[11px] text-slate-400 uppercase font-bold block">
          Empirical Model Divergence Path:
        </span>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-purple-400 font-bold uppercase">M{sourceTick} — CONFIG DIFFERENCE</span>
            <p className="font-semibold text-white">Policy Injected in Universe B</p>
            <p className="text-[10px] text-slate-400">Baseline A vs Variant B policy configured at fork point.</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-purple-400 font-bold uppercase">M{sourceTick + 1} — FIRST DIVERGENCE</span>
            <p className="font-semibold text-white">Fiscal & Banking Decisions</p>
            <p className="text-[10px] text-slate-400">Government spending and monetary parameters diverge.</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-purple-400 font-bold uppercase">M{sourceTick + 3} — SECTOR DIVERGENCE</span>
            <p className="font-semibold text-white">Business Revenues & Hiring</p>
            <p className="text-[10px] text-slate-400">Top diverging: {topDiverging[0]?.name || 'Commercial Sector'}</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-purple-400 font-bold uppercase">MACRO RESULT</span>
            <p className="font-bold text-emerald-400">
              Output Delta: {macroComp.economic_output?.pct_delta >= 0 ? '+' : ''}{macroComp.economic_output?.pct_delta?.toFixed(1)}%
            </p>
            <p className="text-[10px] text-slate-400">Emergent total output divergence after simulation horizon.</p>
          </div>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-slate-400 flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-purple-400 flex-shrink-0" />
        <span>Divergence trace derived from exact state snapshots of Universe A vs Universe B.</span>
      </div>
    </div>
  );
}
