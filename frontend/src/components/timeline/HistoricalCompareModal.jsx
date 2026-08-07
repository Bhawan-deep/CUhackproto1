import React, { useState, useEffect } from 'react';
import { X, Activity, AlertTriangle, TrendingUp, TrendingDown, Clock, Building2, UserCheck } from 'lucide-react';
import { getSnapshotWorld } from '../../api/simulations';

export default function HistoricalCompareModal({ simulationId, marker, currentTick, onClose }) {
  const [tickA, setTickA] = useState(marker ? marker.tick : 0);
  const [tickB, setTickB] = useState(currentTick);
  const [worldA, setWorldA] = useState(null);
  const [worldB, setWorldB] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!simulationId) return;

    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      getSnapshotWorld(simulationId, tickA).catch(() => null),
      getSnapshotWorld(simulationId, tickB).catch(() => null)
    ]).then(([wA, wB]) => {
      if (!isMounted) return;
      setWorldA(wA);
      setWorldB(wB);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [simulationId, tickA, tickB]);

  const metricsA = worldA?.metrics;
  const metricsB = worldB?.metrics;

  const outputDelta = metricsA && metricsB ? metricsB.economic_output - metricsA.economic_output : 0;
  const outputPct = metricsA?.economic_output > 0 ? (outputDelta / metricsA.economic_output) * 100 : 0;
  const empDelta = metricsA && metricsB ? (metricsB.employment_rate - metricsA.employment_rate) * 100 : 0;
  const satDelta = metricsA && metricsB ? (metricsB.public_satisfaction - metricsA.public_satisfaction) * 100 : 0;
  const healthDelta = metricsA && metricsB ? (metricsB.business_health - metricsA.business_health) * 100 : 0;

  return (
    <div className="fixed inset-y-0 right-0 w-96 border-l border-slate-800 bg-[#0B111E]/95 backdrop-blur-md z-40 flex flex-col shadow-2xl font-mono text-xs transition-all duration-300">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <div>
          <h3 className="font-bold text-sm text-sky-400 flex items-center gap-1.5 uppercase">
            <Activity className="w-4 h-4" />
            Historical Snapshot Compare
          </h3>
          <span className="text-[10px] text-slate-400">REAL STORED POSTGRESQL SNAPSHOTS</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tick Selectors */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <span className="text-slate-400 text-[10px] block mb-1">BASELINE (TICK A):</span>
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
            <Clock className="w-3 h-3 text-sky-400" />
            <select
              value={tickA}
              onChange={(e) => setTickA(Number(e.target.value))}
              className="bg-transparent text-white font-bold outline-none cursor-pointer w-full"
            >
              {Array.from({ length: currentTick + 1 }).map((_, i) => (
                <option key={i} value={i} className="bg-slate-900 text-white">Month {i}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <span className="text-slate-400 text-[10px] block mb-1">COMPARISON (TICK B):</span>
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
            <Clock className="w-3 h-3 text-amber-400" />
            <select
              value={tickB}
              onChange={(e) => setTickB(Number(e.target.value))}
              className="bg-transparent text-white font-bold outline-none cursor-pointer w-full"
            >
              {Array.from({ length: currentTick + 1 }).map((_, i) => (
                <option key={i} value={i} className="bg-slate-900 text-white">Month {i}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8 text-slate-400 space-y-2">
            <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-[11px]">Fetching stored PostgreSQL snapshots...</span>
          </div>
        ) : metricsA && metricsB ? (
          <>
            {/* Macro Comparison */}
            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Macroeconomic Deltas (Month {tickA} → Month {tickB})</span>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Employment:</span>
                  <span className="font-bold flex items-center gap-1">
                    {(metricsA.employment_rate * 100).toFixed(1)}% → {(metricsB.employment_rate * 100).toFixed(1)}%
                    <span className={empDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      ({empDelta >= 0 ? '+' : ''}{empDelta.toFixed(1)}pp)
                    </span>
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-300">
                  <span>Economic Output:</span>
                  <span className="font-bold flex items-center gap-1">
                    ${Math.round(metricsA.economic_output / 1000)}k → ${Math.round(metricsB.economic_output / 1000)}k
                    <span className={outputPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      ({outputPct >= 0 ? '+' : ''}{outputPct.toFixed(1)}%)
                    </span>
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-300">
                  <span>Inequality (Gini):</span>
                  <span className="font-bold text-slate-200">
                    {metricsA.inequality.toFixed(3)} → {metricsB.inequality.toFixed(3)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-300">
                  <span>Satisfaction:</span>
                  <span className="font-bold flex items-center gap-1">
                    {(metricsA.public_satisfaction * 100).toFixed(1)}% → {(metricsB.public_satisfaction * 100).toFixed(1)}%
                    <span className={satDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      ({satDelta >= 0 ? '+' : ''}{satDelta.toFixed(1)}pp)
                    </span>
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-300">
                  <span>Business Health:</span>
                  <span className="font-bold flex items-center gap-1">
                    {(metricsA.business_health * 100).toFixed(1)}% → {(metricsB.business_health * 100).toFixed(1)}%
                    <span className={healthDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      ({healthDelta >= 0 ? '+' : ''}{healthDelta.toFixed(1)}pp)
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Entity Snapshot Audit */}
            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-500 uppercase font-bold block flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-sky-400" />
                Entity Comparison Summary
              </span>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Comparison fetched from stored JSONB snapshots for Month {tickA} ({worldA?.businesses?.length || 12} businesses) and Month {tickB} ({worldB?.businesses?.length || 12} businesses).
              </p>
            </div>
          </>
        ) : (
          <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-400 text-center text-[11px]">
            Unable to load snapshots for specified ticks.
          </div>
        )}
      </div>
    </div>
  );
}
