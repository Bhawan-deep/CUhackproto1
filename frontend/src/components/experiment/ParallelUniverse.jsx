import React, { useState, useEffect } from 'react';
import { X, GitFork, Activity, TrendingUp, TrendingDown, Building2, UserCheck, CheckCircle, Zap, Clock, Sliders, Layout, Layers } from 'lucide-react';
import EconomicWorld from '../world/EconomicWorld';
import { getExperimentSnapshot } from '../../api/experiments';

export default function ParallelUniverse({ experimentResult, onClose }) {
  const [activeTab, setActiveTab] = useState('SUMMARY'); // 'SUMMARY' | 'COMPARE_WORLDS'
  const [selectedEntityId, setSelectedEntityId] = useState(null);
  
  // Replay scrubbing within parallel futures
  const [relativeTick, setRelativeTick] = useState(experimentResult?.horizon_ticks || 12);
  const [scrubSnapshot, setScrubSnapshot] = useState(null);
  const [isScrubLoading, setIsScrubLoading] = useState(false);

  const horizonTicks = experimentResult?.horizon_ticks || 12;
  const sourceTick = experimentResult?.source_tick || 0;
  const finalTick = experimentResult?.final_tick || (sourceTick + horizonTicks);

  // Fetch synchronized snapshot when scrubbing relative tick in COMPARE_WORLDS mode
  useEffect(() => {
    if (activeTab !== 'COMPARE_WORLDS' || !experimentResult?.experiment_id) return;

    let isMounted = true;
    setIsScrubLoading(true);

    getExperimentSnapshot(experimentResult.experiment_id, relativeTick)
      .then((data) => {
        if (!isMounted) return;
        setScrubSnapshot(data);
      })
      .catch((err) => console.error('[ParallelUniverse] Failed to load scrub snapshot:', err))
      .finally(() => {
        if (isMounted) setIsScrubLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeTab, relativeTick, experimentResult?.experiment_id]);

  if (!experimentResult) return null;

  const {
    macro_comparison,
    top_diverging_businesses,
    top_diverging_groups,
    world_a,
    world_b
  } = experimentResult;

  const currentWorldA = scrubSnapshot?.world_a || world_a;
  const currentWorldB = scrubSnapshot?.world_b || world_b;

  return (
    <div className="fixed inset-0 bg-[#090D16] z-50 flex flex-col font-mono text-xs overflow-hidden select-none">
      {/* Header Bar */}
      <header className="bg-[#0B111E] border-b border-slate-800 px-6 py-3 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <GitFork className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
              Parallel Universe Counterfactual Results
              <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-500/30 font-semibold">
                Month {sourceTick} → Month {finalTick} (+{horizonTicks} months)
              </span>
            </h1>
            <span className="text-[10px] text-slate-400">SIDE-BY-SIDE SIMULATION EXPERIMENT COMPARISON</span>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('SUMMARY')}
            className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'SUMMARY'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            SUMMARY
          </button>
          <button
            onClick={() => setActiveTab('COMPARE_WORLDS')}
            className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'COMPARE_WORLDS'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            COMPARE WORLDS
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative flex flex-col bg-[#090D16]">
        {activeTab === 'SUMMARY' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-6xl mx-auto w-full">
            {/* Macro Metrics Comparison Cards */}
            {macro_comparison && (
              <div className="space-y-3">
                <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-sky-400" />
                  Macroeconomic Empirical Results (Month {finalTick})
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {/* Employment Card */}
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Employment Rate</span>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-emerald-400 font-bold">A: {(macro_comparison.employment_rate.baseline * 100).toFixed(1)}%</span>
                      <span className="text-amber-400 font-bold">B: {(macro_comparison.employment_rate.variant * 100).toFixed(1)}%</span>
                    </div>
                    <div className="text-[10px] pt-1 border-t border-slate-800 flex justify-between">
                      <span className="text-slate-400">Diff:</span>
                      <span className={`font-bold ${macro_comparison.employment_rate.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {macro_comparison.employment_rate.delta >= 0 ? '+' : ''}{(macro_comparison.employment_rate.delta * 100).toFixed(1)}pp
                      </span>
                    </div>
                  </div>

                  {/* Output Card */}
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Economic Output</span>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-emerald-400 font-bold">A: ${Math.round(macro_comparison.economic_output.baseline / 1000)}k</span>
                      <span className="text-amber-400 font-bold">B: ${Math.round(macro_comparison.economic_output.variant / 1000)}k</span>
                    </div>
                    <div className="text-[10px] pt-1 border-t border-slate-800 flex justify-between">
                      <span className="text-slate-400">Diff:</span>
                      <span className={`font-bold ${macro_comparison.economic_output.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {macro_comparison.economic_output.pct_delta >= 0 ? '+' : ''}{macro_comparison.economic_output.pct_delta.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Inequality Card */}
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Inequality (Gini)</span>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-emerald-400 font-bold">A: {macro_comparison.inequality.baseline.toFixed(3)}</span>
                      <span className="text-amber-400 font-bold">B: {macro_comparison.inequality.variant.toFixed(3)}</span>
                    </div>
                    <div className="text-[10px] pt-1 border-t border-slate-800 flex justify-between">
                      <span className="text-slate-400">Diff:</span>
                      <span className={`font-bold ${macro_comparison.inequality.delta <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {macro_comparison.inequality.delta >= 0 ? '+' : ''}{macro_comparison.inequality.delta.toFixed(3)}
                      </span>
                    </div>
                  </div>

                  {/* Satisfaction Card */}
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Public Satisfaction</span>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-emerald-400 font-bold">A: {(macro_comparison.public_satisfaction.baseline * 100).toFixed(1)}%</span>
                      <span className="text-amber-400 font-bold">B: {(macro_comparison.public_satisfaction.variant * 100).toFixed(1)}%</span>
                    </div>
                    <div className="text-[10px] pt-1 border-t border-slate-800 flex justify-between">
                      <span className="text-slate-400">Diff:</span>
                      <span className={`font-bold ${macro_comparison.public_satisfaction.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {macro_comparison.public_satisfaction.delta >= 0 ? '+' : ''}{(macro_comparison.public_satisfaction.delta * 100).toFixed(1)}pp
                      </span>
                    </div>
                  </div>

                  {/* Health Card */}
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Business Health</span>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-emerald-400 font-bold">A: {(macro_comparison.business_health.baseline * 100).toFixed(1)}%</span>
                      <span className="text-amber-400 font-bold">B: {(macro_comparison.business_health.variant * 100).toFixed(1)}%</span>
                    </div>
                    <div className="text-[10px] pt-1 border-t border-slate-800 flex justify-between">
                      <span className="text-slate-400">Diff:</span>
                      <span className={`font-bold ${macro_comparison.business_health.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {macro_comparison.business_health.delta >= 0 ? '+' : ''}{(macro_comparison.business_health.delta * 100).toFixed(1)}pp
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Entity Divergence Tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Diverging Businesses */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                <span className="text-xs text-sky-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  Top Diverging Businesses
                </span>

                <div className="space-y-2">
                  {(top_diverging_businesses || []).map((b) => (
                    <div key={b.id} className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1 text-[11px]">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white">{b.name} ({b.industry})</span>
                        <span className={`font-bold ${b.deltas.health >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          Health {b.deltas.health >= 0 ? '+' : ''}{Math.round(b.deltas.health * 100)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Universe A: {Math.round(b.baseline.health * 100)}% Health ({b.baseline.employee_count} emp)</span>
                        <span>Universe B: {Math.round(b.variant.health * 100)}% Health ({b.variant.employee_count} emp)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Diverging Citizen Groups */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                <span className="text-xs text-sky-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-amber-400" />
                  Top Diverging Citizen Groups
                </span>

                <div className="space-y-2">
                  {(top_diverging_groups || []).map((g) => (
                    <div key={g.id} className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1 text-[11px]">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white">{g.occupation} ({g.count} citizens)</span>
                        <span className={`font-bold ${g.deltas.employed_count >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          Jobs {g.deltas.employed_count >= 0 ? '+' : ''}{g.deltas.employed_count}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Universe A: {g.baseline.employed_count}/{g.count} emp (Sat: {Math.round(g.baseline.average_satisfaction * 100)}%)</span>
                        <span>Universe B: {g.variant.employed_count}/{g.count} emp (Sat: {Math.round(g.variant.average_satisfaction * 100)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'COMPARE_WORLDS' && (
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* Scrubber Bar for Synchronized Parallel Futures */}
            <div className="bg-slate-900/90 border-b border-slate-800 px-6 py-2 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 text-slate-300 font-bold">
                <Clock className="w-4 h-4 text-sky-400" />
                <span>SCRUB PARALLEL FUTURES: MONTH {sourceTick + relativeTick}</span>
                <span className="text-[10px] text-slate-500">(+{relativeTick} months from fork at Month {sourceTick})</span>
              </div>

              <div className="flex items-center gap-3 w-1/2">
                <input
                  type="range"
                  min="0"
                  max={horizonTicks}
                  value={relativeTick}
                  onChange={(e) => setRelativeTick(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                />
                <span className="font-bold text-sky-400">{relativeTick}/{horizonTicks}</span>
              </div>
            </div>

            {/* Dual Graph Canvas Container */}
            <div className="flex-1 grid grid-cols-2 divide-x divide-slate-800 relative overflow-hidden">
              {/* UNIVERSE A GRAPH */}
              <div className="relative flex flex-col h-full">
                <div className="absolute top-3 left-3 z-30 px-3 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-bold text-xs flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  UNIVERSE A (BASELINE)
                </div>
                <EconomicWorld
                  simulationId={experimentResult.baseline_simulation_id}
                  displayWorld={currentWorldA}
                  viewMode="REPLAY"
                  viewedTick={sourceTick + relativeTick}
                />
              </div>

              {/* UNIVERSE B GRAPH */}
              <div className="relative flex flex-col h-full">
                <div className="absolute top-3 left-3 z-30 px-3 py-1 rounded-lg bg-amber-950/80 border border-amber-500/50 text-amber-300 font-bold text-xs flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  UNIVERSE B (EXPERIMENT)
                </div>
                <EconomicWorld
                  simulationId={experimentResult.variant_simulation_id}
                  displayWorld={currentWorldB}
                  viewMode="REPLAY"
                  viewedTick={sourceTick + relativeTick}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
