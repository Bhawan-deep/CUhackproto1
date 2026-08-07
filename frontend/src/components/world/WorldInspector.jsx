import React from 'react';
import { X, Landmark, Building2, UserCheck, Activity, DollarSign, Users, Award, AlertTriangle, TrendingUp, TrendingDown, Clock } from 'lucide-react';

import { HelpCircle } from 'lucide-react';

export default function WorldInspector({ selectedNode, baseline, impactDeltas, viewMode, viewedTick, onClose, onOpenWhyModal }) {
  if (!selectedNode) return null;

  const { data, type } = selectedNode;
  const nodeId = String(selectedNode.id);

  const isReplay = viewMode === 'REPLAY';

  // Extract delta info for this specific node if baseline exists
  let nodeDelta = null;
  if (baseline && impactDeltas) {
    if (type === 'business') {
      nodeDelta = impactDeltas.businessDeltas[nodeId];
    } else if (type === 'citizenGroup') {
      nodeDelta = impactDeltas.groupDeltas[nodeId];
    }
  }

  const interventionInfo = baseline?.interventionInfo;

  return (
    <div className="w-80 border-l border-slate-800 bg-[#0D1424]/95 backdrop-blur-md h-full flex flex-col shadow-2xl z-30 transition-all duration-300">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {type === 'government' && <Landmark className="w-5 h-5 text-sky-400" />}
          {type === 'business' && <Building2 className="w-5 h-5 text-emerald-400" />}
          {type === 'citizenGroup' && <UserCheck className="w-5 h-5 text-amber-400" />}
          <div>
            <h3 className="font-bold text-sm text-white truncate max-w-[170px]">
              {type === 'government' ? 'Government State' : data.name || data.occupation}
            </h3>
            <span className="text-[10px] font-mono text-slate-400 uppercase">
              {type === 'government' ? 'System Regulator' : type === 'business' ? data.industry : 'Occupation Group'}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Close Inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Signature Feature: WHY DID THIS CHANGE? Button */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/60">
        <button
          onClick={() => onOpenWhyModal && onOpenWhyModal(nodeId)}
          className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-500/20 transition-all duration-300"
        >
          <HelpCircle className="w-4 h-4" />
          <span>WHY DID THIS CHANGE?</span>
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">

        {/* REPLAY MODE HISTORICAL BANNER */}
        {isReplay && (
          <div className="p-2.5 rounded-lg bg-amber-950/70 border border-amber-500/50 flex items-center justify-between text-amber-200">
            <div className="flex items-center gap-1.5 font-bold">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>HISTORICAL STATE</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold text-[10px]">
              MONTH {viewedTick}
            </span>
          </div>
        )}

        {/* SINCE INTERVENTION DELTA SECTION */}
        {baseline && interventionInfo && (
          <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-amber-300 font-bold uppercase flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Change Since Intervention
              </span>
              <span className="text-[9px] text-amber-400/80">Applied M{baseline.appliedTick}</span>
            </div>

            <p className="text-[10px] text-slate-300 border-b border-amber-500/20 pb-1.5">
              Observed response following <strong>{interventionInfo.name}</strong> ({interventionInfo.detail}):
            </p>

            {type === 'business' && nodeDelta && (
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between items-center text-slate-200">
                  <span>Health:</span>
                  <span className={`font-bold flex items-center gap-1 ${nodeDelta.health.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {Math.round(nodeDelta.health.before * 100)}% → {Math.round(nodeDelta.health.current * 100)}%
                    <span>({nodeDelta.health.delta >= 0 ? '+' : ''}{Math.round(nodeDelta.health.delta * 100)}%)</span>
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-200">
                  <span>Employees:</span>
                  <span className={`font-bold ${nodeDelta.employeeCount.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {nodeDelta.employeeCount.before} → {nodeDelta.employeeCount.current} ({nodeDelta.employeeCount.delta >= 0 ? '+' : ''}{nodeDelta.employeeCount.delta})
                  </span>
                </div>
              </div>
            )}

            {type === 'citizenGroup' && nodeDelta && (
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between items-center text-slate-200">
                  <span>Employed Count:</span>
                  <span className={`font-bold ${nodeDelta.employedCount.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {nodeDelta.employedCount.before} → {nodeDelta.employedCount.current} ({nodeDelta.employedCount.delta >= 0 ? '+' : ''}{nodeDelta.employedCount.delta})
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-200">
                  <span>Satisfaction:</span>
                  <span className={`font-bold ${nodeDelta.satisfaction.delta >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {(nodeDelta.satisfaction.before * 100).toFixed(0)}% → {(nodeDelta.satisfaction.current * 100).toFixed(0)}% ({nodeDelta.satisfaction.delta >= 0 ? '+' : ''}{(nodeDelta.satisfaction.delta * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STANDARD METRICS */}
        {type === 'bank' && (
          <div className="p-3 rounded-lg bg-purple-950/40 border border-purple-500/40 space-y-2.5">
            <span className="text-[10px] text-purple-300 block uppercase font-bold">Central Bank Monetary Policy</span>
            <div className="flex justify-between items-center text-slate-200">
              <span>Interest Rate:</span>
              <span className="font-bold text-purple-400 text-sm">{((data.bank?.interest_rate || 0.05) * 100).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between items-center text-slate-200">
              <span>Bank Reserves:</span>
              <span className="font-bold text-slate-200">${Math.round((data.bank?.reserves || 1000000) / 1000).toLocaleString()}k</span>
            </div>
            <div className="flex justify-between items-center text-slate-200">
              <span>Default Rate:</span>
              <span className="font-bold text-amber-400">{((data.bank?.default_rate || 0.02) * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center text-slate-200">
              <span>Decision Provider:</span>
              <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold text-[9px]">DETERMINISTIC MOCK</span>
            </div>
          </div>
        )}

        {type === 'government' && (
          <>
            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Policy Parameters</span>
              <div className="flex justify-between items-center text-slate-200">
                <span>Tax Rate:</span>
                <span className="font-bold text-emerald-400 text-sm">{((data.tax_rate || 0) * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between items-center text-slate-200">
                <span>Infrastructure Spend:</span>
                <span className="font-bold text-sky-400">${(data.infrastructure_spending || 0).toLocaleString()}/mo</span>
              </div>
              <div className="flex justify-between items-center text-slate-200">
                <span>Healthcare Spend:</span>
                <span className="font-bold text-rose-400">${(data.healthcare_spending || 30000).toLocaleString()}/mo</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Treasury & Satisfaction</span>
              <div className="flex justify-between items-center text-slate-200">
                <span>Public Treasury:</span>
                <span className="font-bold text-emerald-400">${Math.round(data.treasury || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-slate-200">
                <span>Public Satisfaction:</span>
                <span className="font-bold text-amber-400">{((data.public_satisfaction || 0) * 100).toFixed(1)}%</span>
              </div>
            </div>
          </>
        )}

        {type === 'business' && (
          <>
            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Health Status</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                  (data.health || 0) >= 0.75 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                  (data.health || 0) >= 0.50 ? 'bg-sky-500/10 text-sky-400 border-sky-500/30' :
                  (data.health || 0) >= 0.25 ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                  'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}>
                  {Math.round((data.health || 0) * 100)}% Health
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    (data.health || 0) >= 0.75 ? 'bg-emerald-400' :
                    (data.health || 0) >= 0.50 ? 'bg-sky-400' :
                    (data.health || 0) >= 0.25 ? 'bg-amber-400' :
                    'bg-rose-400'
                  }`} 
                  style={{ width: `${Math.round((data.health || 0) * 100)}%` }} 
                />
              </div>
            </div>

            {/* Strategic Game Theory Section */}
            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Strategic Game Posture</span>
              <div className="flex justify-between items-center text-slate-300">
                <span>Personality:</span>
                <span className="font-bold text-amber-400 uppercase">{data.personality || 'NEUTRAL'}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Last Rival Move:</span>
                <span className={`font-bold ${data.last_game_move === 'DEFECT' ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {data.last_game_move === 'DEFECT' ? '⚔ DEFECT' : '🤝 COOPERATE'}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Capital Reserves:</span>
                <span className="font-bold text-sky-400">${Math.round(data.capital || 50000).toLocaleString()}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Financial Performance</span>
              <div className="flex justify-between items-center text-slate-300">
                <span>Employee Count:</span>
                <span className="font-bold text-white">{data.employee_count}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Revenue:</span>
                <span className="font-bold text-slate-200">${Math.round(data.revenue || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Profit:</span>
                <span className={`font-bold ${(data.profit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ${Math.round(data.profit || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </>
        )}


        {type === 'citizenGroup' && (
          <>
            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Labor Distribution</span>
              <div className="flex justify-between items-center text-slate-300">
                <span>Total Group Citizens:</span>
                <span className="font-bold text-white">{data.count}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Employed:</span>
                <span className="font-bold text-emerald-400">{data.employed_count}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Unemployed:</span>
                <span className="font-bold text-rose-400">{(data.count || 0) - (data.employed_count || 0)}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Group Well-Being</span>
              <div className="flex justify-between items-center text-slate-300">
                <span>Average Income:</span>
                <span className="font-bold text-sky-400">${Math.round(data.average_income || 0).toLocaleString()}/yr</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Average Wealth:</span>
                <span className="font-bold text-slate-200">${Math.round(data.average_wealth || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Average Satisfaction:</span>
                <span className="font-bold text-amber-400">{((data.average_satisfaction || 0) * 100).toFixed(1)}%</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
