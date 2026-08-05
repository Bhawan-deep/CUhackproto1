import React from 'react';
import { Activity } from 'lucide-react';
import SimulationStatus from './SimulationStatus';

export default function Header({ isBackendConnected, isCheckingHealth, onRetryHealth }) {
  return (
    <header className="border-b border-slate-800 bg-[#0F1623] px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Agent Economy Simulator
              <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700">
                Phase 1 v0.1
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Real-time agent-based economic policy simulation platform
            </p>
          </div>
        </div>

        <SimulationStatus 
          isConnected={isBackendConnected} 
          isChecking={isCheckingHealth} 
          onRetry={onRetryHealth} 
        />
      </div>
    </header>
  );
}
