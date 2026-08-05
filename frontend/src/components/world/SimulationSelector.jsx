import React from 'react';
import { Layers, Plus } from 'lucide-react';

export default function SimulationSelector({
  simulations,
  selectedSimulation,
  onSelect,
  onCreateNew,
  isCreating
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs font-mono">
        <Layers className="w-3.5 h-3.5 text-sky-400 mr-2 shrink-0" />
        <select
          value={selectedSimulation?.id || ''}
          onChange={(e) => {
            const sim = simulations.find(s => s.id === e.target.value);
            if (sim) onSelect(sim);
          }}
          className="bg-transparent text-slate-200 outline-none cursor-pointer pr-4 font-semibold text-xs"
        >
          {simulations.map((sim) => (
            <option key={sim.id} value={sim.id} className="bg-slate-900 text-slate-200">
              {sim.name} (Tick {sim.current_tick}) - {sim.status.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={onCreateNew}
        disabled={isCreating}
        className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1 transition-all disabled:opacity-50"
        title="Create new demo simulation instance"
      >
        <Plus className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">New</span>
      </button>
    </div>
  );
}
