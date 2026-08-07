import React, { useState } from 'react';
import { X, GitFork, Sliders, Zap, AlertTriangle, Play, Clock, CheckCircle } from 'lucide-react';

const SHOCK_OPTIONS = [
  { id: 'none', name: 'None (No Shock)' },
  { id: 'recession', name: 'Recession (Severity 0.7)' },
  { id: 'flood', name: 'Natural Flood (Severity 0.6)' },
  { id: 'factory_closure', name: 'Factory Closure (Severity 0.8)' },
  { id: 'investment_stimulus', name: 'Investment Stimulus (Severity 0.6)' },
  { id: 'boom', name: 'Economic Boom (Severity 0.7)' },
];

export default function CounterfactualLabModal({
  sourceSimId,
  sourceTick,
  sourceWorld,
  onLaunchExperiment,
  onClose
}) {
  const currentGov = sourceWorld?.government || { tax_rate: 0.20, infrastructure_spending: 50000 };

  const [taxRate, setTaxRate] = useState(Math.round((currentGov.tax_rate || 0.20) * 100));
  const [infraSpending, setInfraSpending] = useState(currentGov.infrastructure_spending || 50000);
  const [selectedShock, setSelectedShock] = useState('none');
  const [horizonTicks, setHorizonTicks] = useState(12);
  const [isPending, setIsPending] = useState(false);

  const isTaxChanged = taxRate !== Math.round((currentGov.tax_rate || 0.20) * 100);
  const isInfraChanged = infraSpending !== (currentGov.infrastructure_spending || 50000);
  const isShockActive = selectedShock !== 'none';

  const handleRun = async () => {
    setIsPending(true);
    try {
      const variantPolicy = (isTaxChanged || isInfraChanged) ? {
        tax_rate: taxRate / 100.0,
        infrastructure_spending: Number(infraSpending)
      } : null;

      const variantEvent = isShockActive ? {
        type: selectedShock,
        severity: selectedShock === 'recession' ? 0.7 : selectedShock === 'flood' ? 0.6 : 0.7
      } : null;

      await onLaunchExperiment({
        source_tick: sourceTick,
        horizon_ticks: horizonTicks,
        variant_policy: variantPolicy,
        variant_event: variantEvent
      });
    } catch (err) {
      console.error('[CounterfactualLab] Launch failed:', err);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-mono text-xs select-none">
      <div className="bg-[#0B111E] border border-sky-500/50 rounded-2xl max-w-2xl w-full flex flex-col shadow-2xl overflow-hidden max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <GitFork className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white uppercase tracking-wider">Counterfactual Experiment Lab</h2>
              <span className="text-[10px] text-slate-400">FORK HISTORICAL SNAPSHOT AT MONTH {sourceTick}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Starting State Card */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
            <div className="flex justify-between items-center text-slate-300">
              <span className="font-bold text-sky-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                IDENTICAL STARTING SNAPSHOT (MONTH {sourceTick})
              </span>
              <span className="text-[10px] text-slate-400">Restored from PostgreSQL Snapshot</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Both futures will be initialized from the exact same engine state, citizens, businesses, government, and RNG seed.
            </p>
          </div>

          {/* Side-by-Side Configuration Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* UNIVERSE A: BASELINE */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  Universe A (Baseline)
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  UNCHANGED
                </span>
              </div>
              <div className="space-y-1.5 text-[11px] text-slate-300">
                <div className="flex justify-between">
                  <span>Tax Rate:</span>
                  <span className="font-bold text-emerald-400">{Math.round((currentGov.tax_rate || 0.20) * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Infrastructure:</span>
                  <span className="font-bold text-sky-400">${Math.round((currentGov.infrastructure_spending || 50000) / 1000)}k/mo</span>
                </div>
                <div className="flex justify-between">
                  <span>Economic Events:</span>
                  <span className="text-slate-400">Baseline continuation</span>
                </div>
              </div>
            </div>

            {/* UNIVERSE B: EXPERIMENT */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-amber-500/40 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4" />
                  Universe B (Experiment)
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                  COUNTERFACTUAL
                </span>
              </div>

              {/* Tax Rate Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-300">Tax Rate:</span>
                  <span className="font-bold text-amber-400">{taxRate}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="1"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>

              {/* Infrastructure Spending Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-300">Infrastructure:</span>
                  <span className="font-bold text-sky-400">${Math.round(infraSpending / 1000)}k/mo</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200000"
                  step="5000"
                  value={infraSpending}
                  onChange={(e) => setInfraSpending(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                />
              </div>

              {/* Shock Event Selector */}
              <div className="space-y-1">
                <span className="text-slate-300 text-[10px] block">Shock Event:</span>
                <select
                  value={selectedShock}
                  onChange={(e) => setSelectedShock(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-[11px] text-amber-300 font-bold outline-none cursor-pointer"
                >
                  {SHOCK_OPTIONS.map(opt => (
                    <option key={opt.id} value={opt.id} className="bg-slate-900 text-slate-200">
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Simulation Horizon Selector */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <span className="font-bold text-slate-300">Simulation Horizon:</span>
            <div className="flex items-center gap-2">
              {[5, 10, 12, 24].map((h) => (
                <button
                  key={h}
                  onClick={() => setHorizonTicks(h)}
                  className={`px-3 py-1 rounded font-bold transition-all ${
                    horizonTicks === h
                      ? 'bg-sky-500 text-slate-950 shadow'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                  }`}
                >
                  +{h} Months
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            Simulating Month {sourceTick} → Month {sourceTick + horizonTicks} (+{horizonTicks} months)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleRun}
              disabled={isPending}
              className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-white" />
              {isPending ? 'Forks Initializing...' : 'RUN PARALLEL FUTURES'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
