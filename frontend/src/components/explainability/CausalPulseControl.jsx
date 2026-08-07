import React from 'react';
import { Zap } from 'lucide-react';

export default function CausalPulseControl({ isPulseEnabled, onTogglePulse }) {
  return (
    <button
      onClick={onTogglePulse}
      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all duration-300 shadow-md ${
        isPulseEnabled
          ? 'bg-amber-500 text-slate-950 border border-amber-300 ring-2 ring-amber-400/50 animate-pulse'
          : 'bg-slate-900 text-amber-400 border border-slate-700 hover:border-amber-500/50 hover:bg-slate-850'
      }`}
      title="Toggle live sequential causal pulse animations on graph"
    >
      <Zap className={`w-3.5 h-3.5 ${isPulseEnabled ? 'fill-slate-950' : 'fill-amber-400'}`} />
      <span>{isPulseEnabled ? '⚡ PULSE ACTIVE' : '⚡ CAUSAL PULSE'}</span>
    </button>
  );
}
