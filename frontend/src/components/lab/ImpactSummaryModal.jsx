import React from 'react';
import { X, Activity, TrendingUp, TrendingDown, Building2, UserCheck, AlertTriangle } from 'lucide-react';

export default function ImpactSummaryModal({ baseline, impactDeltas, currentTick, onClose }) {
  if (!baseline || !impactDeltas) return null;

  const info = baseline.interventionInfo || { name: 'Intervention', detail: '', appliedTick: baseline.appliedTick };
  const monthsElapsed = Math.max(0, currentTick - baseline.appliedTick);

  const { macroDeltas, mostAffectedBusinesses, mostAffectedGroups } = impactDeltas;

  return (
    <div className="fixed inset-y-0 right-0 w-96 border-l border-slate-800 bg-[#0B111E]/95 backdrop-blur-md z-40 flex flex-col shadow-2xl font-mono text-xs transition-all duration-300">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <div>
          <h3 className="font-bold text-sm text-sky-400 flex items-center gap-1.5 uppercase">
            <Activity className="w-4 h-4" />
            Impact Summary
          </h3>
          <span className="text-[10px] text-slate-400">OBSERVED MACRO & ENTITY RESPONSES</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Intervention Timer Badge Header */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 text-[11px] space-y-1">
        <div className="flex items-center justify-between text-slate-200 font-bold">
          <span className="flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            {info.name}
          </span>
          <span className="text-emerald-400">+{monthsElapsed} months elapsed</span>
        </div>
        <div className="text-[10px] text-slate-400 flex justify-between">
          <span>Applied at Month {baseline.appliedTick}</span>
          <span>Observing Month {currentTick}</span>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Macro Metric Deltas */}
        {macroDeltas && (
          <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Macroeconomic Deltas (Baseline → Current)</span>
            
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between items-center text-slate-300">
                <span>Employment:</span>
                <span className="font-bold flex items-center gap-1">
                  {(macroDeltas.employment.before * 100).toFixed(1)}% → {(macroDeltas.employment.current * 100).toFixed(1)}%
                  <span className={macroDeltas.employment.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    ({macroDeltas.employment.delta >= 0 ? '+' : ''}{(macroDeltas.employment.delta * 100).toFixed(1)}pp)
                  </span>
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <span>Economic Output:</span>
                <span className="font-bold flex items-center gap-1">
                  ${Math.round(macroDeltas.output.before / 1000)}k → ${Math.round(macroDeltas.output.current / 1000)}k
                  <span className={macroDeltas.output.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    ({macroDeltas.output.pctDelta >= 0 ? '+' : ''}{macroDeltas.output.pctDelta.toFixed(1)}%)
                  </span>
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <span>Gini Inequality:</span>
                <span className="font-bold flex items-center gap-1">
                  {macroDeltas.inequality.before.toFixed(3)} → {macroDeltas.inequality.current.toFixed(3)}
                  <span className={macroDeltas.inequality.delta <= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                    ({macroDeltas.inequality.delta >= 0 ? '+' : ''}{macroDeltas.inequality.delta.toFixed(3)})
                  </span>
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <span>Satisfaction:</span>
                <span className="font-bold flex items-center gap-1">
                  {(macroDeltas.satisfaction.before * 100).toFixed(1)}% → {(macroDeltas.satisfaction.current * 100).toFixed(1)}%
                  <span className={macroDeltas.satisfaction.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    ({macroDeltas.satisfaction.delta >= 0 ? '+' : ''}{(macroDeltas.satisfaction.delta * 100).toFixed(1)}pp)
                  </span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Top 3 Most Affected Businesses */}
        <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
          <span className="text-[10px] text-slate-500 uppercase font-bold block flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            Most Affected Businesses (Ranked)
          </span>

          {mostAffectedBusinesses && mostAffectedBusinesses.length > 0 ? (
            <div className="space-y-1.5">
              {mostAffectedBusinesses.map((b, idx) => (
                <div key={b.id} className="p-2 rounded bg-slate-950/60 border border-slate-800 flex justify-between items-center text-[11px]">
                  <div>
                    <span className="font-bold text-slate-200 block">#{idx + 1} {b.name}</span>
                    <span className="text-[9px] text-slate-400">{b.industry}</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold block ${b.health.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      Health {b.health.delta >= 0 ? '+' : ''}{Math.round(b.health.delta * 100)}%
                    </span>
                    <span className="text-[9px] text-slate-400">
                      Jobs: {b.employeeCount.delta >= 0 ? '+' : ''}{b.employeeCount.delta}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-slate-500">No business exceeded meaningful change threshold yet.</p>
          )}
        </div>

        {/* Top 3 Most Affected Citizen Groups */}
        <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
          <span className="text-[10px] text-slate-500 uppercase font-bold block flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
            Most Affected Citizen Groups (Ranked)
          </span>

          {mostAffectedGroups && mostAffectedGroups.length > 0 ? (
            <div className="space-y-1.5">
              {mostAffectedGroups.map((g, idx) => (
                <div key={g.id} className="p-2 rounded bg-slate-950/60 border border-slate-800 flex justify-between items-center text-[11px]">
                  <div>
                    <span className="font-bold text-slate-200 block">#{idx + 1} {g.occupation}</span>
                    <span className="text-[9px] text-slate-400">{g.count} citizens total</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold block ${g.employedCount.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      Employed: {g.employedCount.delta >= 0 ? '+' : ''}{g.employedCount.delta}
                    </span>
                    <span className="text-[9px] text-amber-400">
                      Sat: {g.satisfaction.delta >= 0 ? '+' : ''}{Math.round(g.satisfaction.delta * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-slate-500">No citizen group exceeded meaningful change threshold yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
