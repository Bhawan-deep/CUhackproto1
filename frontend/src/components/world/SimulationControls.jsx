import React from 'react';
import { Play, Pause, Activity, RotateCcw } from 'lucide-react';

export default function SimulationControls({
  status,
  isPending,
  onStart,
  onPause,
  onResume,
  onStep,
  onReset
}) {
  const isRunning = status === "running";
  const isPaused = status === "paused";

  return (
    <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1 rounded-lg">
      {isPaused ? (
        <button
          onClick={onResume}
          disabled={isPending}
          className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1 transition-all shadow disabled:opacity-50"
          title="Resume automatic ticking"
        >
          <Play className="w-3 h-3 fill-white" />
          Resume
        </button>
      ) : (
        <button
          onClick={onStart}
          disabled={isRunning || isPending}
          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition-all shadow disabled:opacity-50 disabled:cursor-not-allowed"
          title="Start automatic runner"
        >
          <Play className="w-3 h-3 fill-white" />
          Start
        </button>
      )}

      <button
        onClick={onPause}
        disabled={!isRunning || isPending}
        className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1 transition-all shadow disabled:opacity-50 disabled:cursor-not-allowed"
        title="Pause automatic runner"
      >
        <Pause className="w-3 h-3 fill-white" />
        Pause
      </button>

      <button
        onClick={onStep}
        disabled={isRunning || isPending}
        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 text-xs font-semibold flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        title={isRunning ? "Pause simulation before manually stepping" : "Manually advance 1 tick"}
      >
        <Activity className="w-3 h-3" />
        Step
      </button>

      <button
        onClick={onReset}
        disabled={isPending}
        className="px-2.5 py-1 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/60 text-xs font-semibold flex items-center gap-1 transition-all disabled:opacity-50"
        title="Reset simulation back to initial Tick 0 state"
      >
        <RotateCcw className="w-3 h-3" />
        Reset
      </button>
    </div>
  );
}
