import React, { useState, useEffect } from 'react';
import { X, HelpCircle, ArrowDown, Activity, CheckCircle2, ShieldAlert } from 'lucide-react';
import { getEntityExplanation } from '../../api/simulations';

export default function WhyInspectorModal({ simulationId, tick, entityId, onClose }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!simulationId || !entityId) return;

    setIsLoading(true);
    setError(null);

    getEntityExplanation(simulationId, tick || 0, entityId)
      .then((res) => {
        setData(res);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load entity explanation:", err);
        setError("Unable to load causal trace for this entity.");
        setIsLoading(false);
      });
  }, [simulationId, tick, entityId]);

  if (!entityId) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0B132B] border border-amber-500/40 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-mono">
        {/* Header */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                SIMULATED CAUSAL TRACE — Month {tick || 0}
              </h3>
              <span className="text-xs text-amber-300 font-semibold uppercase">
                {data?.entity_name || entityId} ({data?.entity_type || 'entity'})
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <Activity className="w-6 h-6 animate-spin mx-auto text-amber-400" />
              <p>Reconstructing empirical simulation deltas & causal events...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300">
              {error}
            </div>
          ) : (
            <>
              {/* Summary Headline */}
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200">
                <span className="text-[10px] text-amber-400/80 uppercase font-bold block mb-1">Causal Headline</span>
                <p className="text-sm font-semibold">{data?.headline}</p>
              </div>

              {/* Observed State Changes */}
              {data?.observed_deltas && Object.keys(data.observed_deltas).length > 0 && (
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <span className="text-[11px] text-slate-400 uppercase font-bold block">Observed Metric Deltas</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(data.observed_deltas).map(([k, v]) => (
                      <div key={k} className="p-2 rounded bg-slate-950 border border-slate-800/80 flex justify-between">
                        <span className="text-slate-400 uppercase text-[10px]">{k}:</span>
                        <span className="font-bold text-white">
                          {typeof v === 'number' ? (v > 100 ? `$${v.toLocaleString()}` : v) : String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step-by-Step Causal Chain */}
              <div className="space-y-3">
                <span className="text-xs text-amber-300 uppercase font-bold flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-amber-400" />
                  Sequential Model Causal Chain
                </span>

                {data?.causal_chains && data.causal_chains.length > 0 ? (
                  data.causal_chains.map((chain) => (
                    <div key={chain.chain_id} className="space-y-2">
                      {chain.steps.map((step, idx) => (
                        <React.Fragment key={step.id || idx}>
                          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3 hover:border-amber-500/40 transition-colors">
                            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 font-bold text-xs mt-0.5 border border-amber-500/20">
                              0{idx + 1}
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-amber-300 text-xs uppercase">{step.type}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                                  {step.confidence || 'deterministic'}
                                </span>
                              </div>
                              <p className="text-slate-200 text-xs font-semibold">{step.description}</p>
                              {step.delta !== null && step.delta !== undefined && (
                                <div className="text-[10px] text-slate-400">
                                  Metric: <strong className="text-amber-400">{step.metric}</strong> | Delta: <strong className={step.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{step.delta >= 0 ? '+' : ''}{step.delta}</strong>
                                </div>
                              )}
                            </div>
                          </div>
                          {idx < chain.steps.length - 1 && (
                            <div className="flex justify-center my-1">
                              <ArrowDown className="w-4 h-4 text-amber-500/60" />
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-xl bg-slate-900 text-slate-400 text-center">
                    No significant state changes recorded for this entity during Month {tick || 0}.
                  </div>
                )}
              </div>

              {/* Scientific Disclaimer */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-slate-400 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>{data?.model_assumptions_disclaimer || "Simulated causal trace derived from authoritative simulation engine equations."}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
