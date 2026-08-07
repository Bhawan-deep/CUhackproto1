import React, { useState } from 'react';
import { Brain, ChevronDown, ChevronUp, Landmark, ShieldCheck, Building, UserCheck } from 'lucide-react';

export default function AgentActivityPanel({ agentActivity }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!agentActivity) return null;

  const finance = agentActivity.finance || {};
  const health = agentActivity.health || {};
  const infra = agentActivity.infrastructure || {};
  const bank = agentActivity.bank || {};
  const complianceRate = agentActivity.citizen_compliance_rate || 0.85;

  return (
    <div className="border-t border-slate-800 bg-[#0B132B]/95 font-mono text-xs z-30 transition-all duration-300">
      {/* Header Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 bg-slate-900/90 hover:bg-slate-850 border-b border-slate-800 flex items-center justify-between text-slate-200 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-400" />
          <span className="font-bold text-xs uppercase tracking-wider text-purple-300">
            AGENT DECISION INSPECTOR
          </span>
          <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold text-[10px]">
            {agentActivity.provider ? agentActivity.provider.toUpperCase() : 'MOCK'} PROVIDER
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-[11px]">
          <span>{isOpen ? 'Collapse' : 'Expand Inspector'}</span>
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Content Drawer */}
      {isOpen && (
        <div className="p-4 max-h-[300px] overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-950/90">
          {/* Finance Agent Card */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="font-bold text-sky-400 flex items-center gap-1.5 text-xs">
                <Landmark className="w-3.5 h-3.5" /> FINANCE AGENT
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold">FISCAL</span>
            </div>
            <div className="space-y-1 text-[11px]">
              <div className="text-slate-300"><strong>Action:</strong> {finance.action_summary || 'Tax Adjustment'}</div>
              <div className="text-slate-400 italic bg-slate-950 p-2 rounded border border-slate-800 text-[10px]">
                "{finance.reasoning_summary || 'Fiscal posture balanced against current unemployment and treasury levels.'}"
              </div>
            </div>
          </div>

          {/* Central Bank Card */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="font-bold text-purple-400 flex items-center gap-1.5 text-xs">
                <ShieldCheck className="w-3.5 h-3.5" /> CENTRAL BANK
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">MONETARY</span>
            </div>
            <div className="space-y-1 text-[11px]">
              <div className="text-slate-300"><strong>Action:</strong> {bank.action_summary || 'Interest Rate Update'}</div>
              <div className="text-slate-400 italic bg-slate-950 p-2 rounded border border-slate-800 text-[10px]">
                "{bank.reasoning_summary || 'Monetary rate set based on inflation pressures and default rates.'}"
              </div>
            </div>
          </div>

          {/* Infrastructure Agent Card */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs">
                <Building className="w-3.5 h-3.5" /> INFRASTRUCTURE
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">STIMULUS</span>
            </div>
            <div className="space-y-1 text-[11px]">
              <div className="text-slate-300"><strong>Action:</strong> {infra.action_summary || 'Capital Allocation'}</div>
              <div className="text-slate-400 italic bg-slate-950 p-2 rounded border border-slate-800 text-[10px]">
                "{infra.reasoning_summary || 'Infrastructure spending targets public employment multiplier.'}"
              </div>
            </div>
          </div>

          {/* Citizen Behavioral Compliance Card */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="font-bold text-amber-400 flex items-center gap-1.5 text-xs">
                <UserCheck className="w-3.5 h-3.5" /> CITIZEN BEHAVIOR
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">COMPLIANCE</span>
            </div>
            <div className="space-y-1 text-[11px]">
              <div className="text-slate-300"><strong>Tax Compliance:</strong> {(complianceRate * 100).toFixed(1)}%</div>
              <div className="text-slate-400 italic bg-slate-950 p-2 rounded border border-slate-800 text-[10px]">
                "Citizen tax compliance shifts dynamically with public satisfaction and tax burden."
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
