import React from 'react';
import { Landmark, Building2, UserCheck } from 'lucide-react';

export default function WorldTooltip({ hoveredNode, mousePos }) {
  if (!hoveredNode || !mousePos) return null;

  const { data, type } = hoveredNode;
  const style = {
    left: `${mousePos.x + 15}px`,
    top: `${mousePos.y + 15}px`,
  };

  return (
    <div
      style={style}
      className="fixed z-50 pointer-events-none p-3 rounded-lg border border-slate-700 bg-slate-900/95 backdrop-blur-md shadow-2xl text-xs font-mono max-w-xs space-y-1.5 transition-opacity duration-150"
    >
      {type === 'government' && (
        <>
          <div className="flex items-center gap-2 border-b border-slate-800 pb-1 font-bold text-sky-400">
            <Landmark className="w-4 h-4" />
            Government State
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-300">
            <span>Tax Rate:</span> <span className="text-right text-emerald-400 font-bold">{((data.tax_rate || 0) * 100).toFixed(0)}%</span>
            <span>Infra Spend:</span> <span className="text-right">${(data.infrastructure_spending || 0).toLocaleString()}/mo</span>
            <span>Treasury:</span> <span className="text-right text-emerald-400">${Math.round(data.treasury || 0).toLocaleString()}</span>
            <span>Satisfaction:</span> <span className="text-right text-amber-400">{((data.public_satisfaction || 0) * 100).toFixed(1)}%</span>
          </div>
        </>
      )}

      {type === 'business' && (
        <>
          <div className="flex items-center gap-2 border-b border-slate-800 pb-1 font-bold text-white">
            <Building2 className="w-4 h-4 text-sky-400" />
            {data.name}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-300">
            <span>Industry:</span> <span className="text-right text-slate-400">{data.industry}</span>
            <span>Health:</span> <span className="text-right text-emerald-400 font-bold">{Math.round((data.health || 0) * 100)}%</span>
            <span>Employees:</span> <span className="text-right">{data.employee_count}</span>
            <span>Revenue:</span> <span className="text-right">${Math.round(data.revenue || 0).toLocaleString()}</span>
            <span>Profit:</span> <span className="text-right text-emerald-400">${Math.round(data.profit || 0).toLocaleString()}</span>
          </div>
        </>
      )}

      {type === 'citizenGroup' && (
        <>
          <div className="flex items-center gap-2 border-b border-slate-800 pb-1 font-bold text-sky-300">
            <UserCheck className="w-4 h-4 text-sky-400" />
            {data.occupation}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-300">
            <span>Employment:</span> <span className="text-right text-emerald-400 font-bold">{data.employed_count}/{data.count} ({Math.round(((data.employed_count || 0) / (data.count || 1)) * 100)}%)</span>
            <span>Avg Income:</span> <span className="text-right">${Math.round(data.average_income || 0).toLocaleString()}/yr</span>
            <span>Avg Wealth:</span> <span className="text-right">${Math.round(data.average_wealth || 0).toLocaleString()}</span>
            <span>Satisfaction:</span> <span className="text-right text-amber-400">{((data.average_satisfaction || 0) * 100).toFixed(1)}%</span>
          </div>
        </>
      )}
    </div>
  );
}
