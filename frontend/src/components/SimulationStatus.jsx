import React from 'react';
import { Server, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SimulationStatus({ isConnected, isChecking, onRetry }) {
  return (
    <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 px-3.5 py-2 rounded-md">
      <div className="flex items-center gap-2 text-xs font-mono">
        <Server className="w-4 h-4 text-slate-400" />
        <span className="text-slate-400 hidden sm:inline">Backend API:</span>
        {isChecking ? (
          <span className="flex items-center gap-1.5 text-amber-400">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Connecting...
          </span>
        ) : isConnected ? (
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Connected
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-rose-400 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            Disconnected
          </span>
        )}
      </div>

      {!isChecking && onRetry && (
        <button
          onClick={onRetry}
          title="Retry backend health check"
          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
