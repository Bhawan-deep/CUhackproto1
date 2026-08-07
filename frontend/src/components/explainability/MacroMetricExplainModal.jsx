import React from 'react';
import { X, TrendingUp, TrendingDown, Minus, ShieldAlert, Activity } from 'lucide-react';

export default function MacroMetricExplainModal({ metricName, metricValue, liveState, onClose }) {
  if (!metricName) return null;

  const metrics = liveState?.metrics || {};
  const activeEvents = liveState?.active_events || [];

  // Reconstruct empirical model factors for selected metric
  const factors = [];

  if (metricName === 'Employment') {
    factors.push({ factor: 'Infrastructure Stimulus Multiplier', direction: 'POSITIVE', desc: 'Government infrastructure investment stimulates labor hiring.' });
    if (activeEvents.some(e => e.type === 'recession')) {
      factors.push({ factor: 'Recession Shock Demand Contraction', direction: 'NEGATIVE', desc: 'Recession depresses business consumer demand and hiring capacity.' });
    }
    factors.push({ factor: 'Business Capital Allocation', direction: 'POSITIVE', desc: 'Profitable businesses retain and expand workforce.' });
  } else if (metricName === 'Output') {
    factors.push({ factor: 'Aggregate Business Revenues', direction: 'POSITIVE', desc: 'Sum of real-time sales across all 12 commercial enterprises.' });
    factors.push({ factor: 'Central Bank Interest Rate Drag', direction: 'NEGATIVE', desc: 'Higher borrowing costs tighten business capital expansion.' });
  } else if (metricName === 'Inequality') {
    factors.push({ factor: 'High-Skill vs Low-Skill Wage Dispersion', direction: 'NEGATIVE', desc: 'Technology & Financial wage premiums increase Gini coefficient.' });
    factors.push({ factor: 'Unemployment Safety Net', direction: 'POSITIVE', desc: 'Public social spending buffers income inequality during downturns.' });
  } else if (metricName === 'Satisfaction') {
    factors.push({ factor: 'Tax Rate Burden', direction: 'NEGATIVE', desc: 'Higher income taxation directly reduces net household satisfaction.' });
    factors.push({ factor: 'Employment Stability', direction: 'POSITIVE', desc: 'Employed citizens maintain baseline 70%+ public satisfaction.' });
  } else if (metricName === 'Business Health') {
    factors.push({ factor: 'Operating Margin & Profitability', direction: 'POSITIVE', desc: 'Positive net profit expands business health reserves.' });
    factors.push({ factor: 'Prisoner\'s Dilemma Defection Cost', direction: 'NEGATIVE', desc: 'Rival defection reduces sector market share and health.' });
  }

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0B132B] border border-sky-500/40 rounded-2xl w-full max-w-lg shadow-2xl font-mono overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-white uppercase tracking-wider">
              WHY IS {metricName.toUpperCase()} AT {metricValue}?
            </h3>
            <span className="text-[10px] text-sky-400 font-semibold">
              SIMULATED MODEL FACTOR DECOMPOSITION
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          <span className="text-[11px] text-slate-400 uppercase font-bold block">
            Top Simulated Model Contributors:
          </span>

          <div className="space-y-2.5">
            {factors.map((f, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                <div className={`p-1.5 rounded-lg font-bold text-xs ${
                  f.direction === 'POSITIVE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  f.direction === 'NEGATIVE' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                  'bg-slate-800 text-slate-400'
                }`}>
                  {f.direction === 'POSITIVE' ? <TrendingUp className="w-4 h-4" /> :
                   f.direction === 'NEGATIVE' ? <TrendingDown className="w-4 h-4" /> :
                   <Minus className="w-4 h-4" />}
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{f.factor}</span>
                    <span className={`text-[9px] font-bold uppercase ${
                      f.direction === 'POSITIVE' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {f.direction}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-slate-400 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-sky-400 flex-shrink-0" />
            <span>Simulated effect direction under current model equations and state parameters.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
