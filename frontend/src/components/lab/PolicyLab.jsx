import React, { useState } from 'react';
import { Landmark, Sliders, CheckCircle, AlertCircle } from 'lucide-react';

export default function PolicyLab({ currentPolicy, onApplyPolicy, isPending }) {
  const [taxRate, setTaxRate] = useState(currentPolicy ? Math.round((currentPolicy.tax_rate || 0.20) * 100) : 20);
  const [infraSpending, setInfraSpending] = useState(currentPolicy ? currentPolicy.infrastructure_spending || 50000 : 50000);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const currentTaxPct = currentPolicy ? Math.round((currentPolicy.tax_rate || 0.20) * 100) : 20;
  const currentInfra = currentPolicy ? currentPolicy.infrastructure_spending || 50000 : 50000;

  const handleApplyClick = () => {
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    setShowConfirmation(false);
    onApplyPolicy({
      tax_rate: taxRate / 100.0,
      infrastructure_spending: Number(infraSpending)
    });
  };

  return (
    <div className="space-y-4 text-xs font-mono">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <span className="font-bold text-sky-400 flex items-center gap-1.5 uppercase">
          <Landmark className="w-4 h-4" />
          Government Policy Lab
        </span>
        <span className="text-[10px] text-slate-400">Target Range Validated</span>
      </div>

      {/* TAX RATE CONTROL */}
      <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-slate-300 font-semibold">TAX RATE</span>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 mr-2">Current: {currentTaxPct}%</span>
            <span className="text-emerald-400 font-bold text-sm">{taxRate}%</span>
          </div>
        </div>
        <input
          type="range"
          min="0"
          max="60"
          step="1"
          value={taxRate}
          onChange={(e) => setTaxRate(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
        />
        <div className="flex justify-between text-[9px] text-slate-500">
          <span>0%</span>
          <span>30%</span>
          <span>60% (Max)</span>
        </div>
      </div>

      {/* INFRASTRUCTURE SPENDING CONTROL */}
      <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-slate-300 font-semibold">INFRASTRUCTURE SPENDING</span>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 mr-2">Current: ${Math.round(currentInfra / 1000)}k</span>
            <span className="text-sky-400 font-bold text-sm">${Math.round(infraSpending / 1000)}k/mo</span>
          </div>
        </div>
        <input
          type="range"
          min="0"
          max="200000"
          step="5000"
          value={infraSpending}
          onChange={(e) => setInfraSpending(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
        />
        <div className="flex justify-between text-[9px] text-slate-500">
          <span>$0</span>
          <span>$100k</span>
          <span>$200k</span>
        </div>
      </div>

      {/* CONFIRMATION OVERLAY PREVIEW */}
      {showConfirmation ? (
        <div className="p-3 rounded-lg bg-sky-950/80 border border-sky-600/60 space-y-2">
          <div className="flex items-center gap-1.5 text-sky-300 font-bold">
            <AlertCircle className="w-4 h-4 text-sky-400" />
            Confirm Policy Intervention
          </div>
          <div className="space-y-1 text-[11px] text-slate-300">
            <div className="flex justify-between">
              <span>Tax Rate:</span>
              <span className="font-bold text-emerald-400">{currentTaxPct}% → {taxRate}%</span>
            </div>
            <div className="flex justify-between">
              <span>Infrastructure:</span>
              <span className="font-bold text-sky-400">${Math.round(currentInfra / 1000)}k → ${Math.round(infraSpending / 1000)}k</span>
            </div>
          </div>
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
              className="flex-1 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
            >
              Apply Policy
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleApplyClick}
          disabled={isPending}
          className="w-full py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center justify-center gap-2 transition-all shadow disabled:opacity-50"
        >
          <Sliders className="w-4 h-4" />
          Apply Policy Changes
        </button>
      )}
    </div>
  );
}
