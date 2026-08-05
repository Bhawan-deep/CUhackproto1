import React, { useState } from 'react';
import { X, Sliders, Zap, History, Settings } from 'lucide-react';
import PolicyLab from './PolicyLab';
import ShockLab from './ShockLab';
import InterventionHistory from './InterventionHistory';

export default function InterventionLab({
  currentPolicy,
  onApplyPolicy,
  onInjectShock,
  interventionHistory,
  isPending,
  onClose
}) {
  const [activeTab, setActiveTab] = useState('policy'); // 'policy' | 'shock' | 'history'

  return (
    <div className="fixed inset-y-0 right-0 w-85 border-l border-slate-800 bg-[#0B111E]/95 backdrop-blur-md z-40 flex flex-col shadow-2xl font-mono text-xs transition-all duration-300">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white uppercase tracking-wider">Intervention Lab</h3>
            <span className="text-[10px] text-slate-400">ECONOMIC DIGITAL TWIN CONTROLS</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Close Intervention Lab"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/60">
        <button
          onClick={() => setActiveTab('policy')}
          className={`flex-1 py-2 text-[11px] font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'policy'
              ? 'border-sky-400 text-sky-400 bg-slate-900/80'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Policy Lab
        </button>

        <button
          onClick={() => setActiveTab('shock')}
          className={`flex-1 py-2 text-[11px] font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'shock'
              ? 'border-amber-400 text-amber-400 bg-slate-900/80'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Shock Lab
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 text-[11px] font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'history'
              ? 'border-emerald-400 text-emerald-400 bg-slate-900/80'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          History
        </button>
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'policy' && (
          <PolicyLab
            currentPolicy={currentPolicy}
            onApplyPolicy={onApplyPolicy}
            isPending={isPending}
          />
        )}

        {activeTab === 'shock' && (
          <ShockLab
            onInjectShock={onInjectShock}
            isPending={isPending}
          />
        )}

        {activeTab === 'history' && (
          <InterventionHistory history={interventionHistory} />
        )}
      </div>
    </div>
  );
}
