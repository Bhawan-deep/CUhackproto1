import React, { useState } from 'react';
import { Zap, AlertTriangle, TrendingUp, Flame, ShieldAlert } from 'lucide-react';

const EVENT_OPTIONS = [
  { id: 'recession', name: 'Recession', category: 'shock', icon: AlertTriangle, desc: 'Downturn in consumer spending & business revenue' },
  { id: 'flood', name: 'Natural Flood', category: 'shock', icon: Flame, desc: 'Disrupts infrastructure and public satisfaction' },
  { id: 'factory_closure', name: 'Factory Closure', category: 'shock', icon: ShieldAlert, desc: 'Severe reduction in workforce hiring capacity' },
  { id: 'investment_stimulus', name: 'Investment Stimulus', category: 'stimulus', icon: TrendingUp, desc: 'Boosts business revenue and capital investment' },
  { id: 'boom', name: 'Economic Boom', category: 'stimulus', icon: Zap, desc: 'Accelerates consumer demand and employment' },
];

export default function ShockLab({ onInjectShock, isPending }) {
  const [selectedEventType, setSelectedEventType] = useState('recession');
  const [severity, setSeverity] = useState(0.7);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const selectedOption = EVENT_OPTIONS.find(e => e.id === selectedEventType);

  const handleConfirm = () => {
    setShowConfirmation(false);
    onInjectShock({
      type: selectedEventType,
      severity: Number(severity)
    });
  };

  return (
    <div className="space-y-4 text-xs font-mono">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <span className="font-bold text-amber-400 flex items-center gap-1.5 uppercase">
          <Zap className="w-4 h-4" />
          Economic Shock & Stimulus Lab
        </span>
        <span className="text-[10px] text-slate-400">Backend Supported</span>
      </div>

      {/* EVENT SELECTOR GRID */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-slate-400 uppercase font-bold block">Select Event Type</span>
        <div className="grid grid-cols-1 gap-1.5">
          {EVENT_OPTIONS.map(opt => {
            const Icon = opt.icon;
            const isSelected = selectedEventType === opt.id;
            const isShock = opt.category === 'shock';
            return (
              <button
                key={opt.id}
                onClick={() => setSelectedEventType(opt.id)}
                className={`p-2 rounded-lg border text-left flex items-start gap-2.5 transition-all ${
                  isSelected
                    ? isShock
                      ? 'bg-amber-950/60 border-amber-500 text-amber-200 ring-1 ring-amber-500/30'
                      : 'bg-emerald-950/60 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/30'
                    : 'bg-slate-900/80 border-slate-800 hover:bg-slate-850 text-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${isShock ? 'text-amber-400' : 'text-emerald-400'}`} />
                <div className="overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{opt.name}</span>
                    <span className={`text-[9px] uppercase px-1.5 py-0.2 rounded border font-semibold ${
                      isShock ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {opt.category}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SEVERITY SLIDER */}
      <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-slate-300 font-semibold">SEVERITY INTENSITY</span>
          <span className="text-amber-400 font-bold text-sm">
            {severity <= 0.35 ? 'MILD (0.3)' : severity <= 0.75 ? 'MODERATE (0.6)' : 'SEVERE (0.9)'} ({severity.toFixed(1)})
          </span>
        </div>
        <input
          type="range"
          min="0.1"
          max="1.0"
          step="0.1"
          value={severity}
          onChange={(e) => setSeverity(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
        />
        <div className="flex justify-between text-[9px] text-slate-500">
          <span>0.1 (Mild)</span>
          <span>0.5 (Moderate)</span>
          <span>1.0 (Extreme)</span>
        </div>
      </div>

      {/* CONFIRMATION OVERLAY */}
      {showConfirmation ? (
        <div className="p-3 rounded-lg bg-amber-950/80 border border-amber-600/60 space-y-2">
          <div className="flex items-center gap-1.5 text-amber-300 font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Confirm Event Injection
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Injecting <strong>{selectedOption?.name}</strong> at <strong>{(severity * 100).toFixed(0)}% severity</strong> into simulation runtime.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setShowConfirmation(false)}
              className="flex-1 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isPending}
              className="flex-1 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
            >
              Inject Event
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowConfirmation(true)}
          disabled={isPending}
          className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center justify-center gap-2 transition-all shadow disabled:opacity-50"
        >
          <Zap className="w-4 h-4" />
          Inject {selectedOption?.name} Shock
        </button>
      )}
    </div>
  );
}
