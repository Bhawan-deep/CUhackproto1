import React from 'react';

/**
 * BountyAnalyticsCharts Component
 * Lightweight, interactive SVG/CSS data dashboard charts.
 * Connects directly to B3 search/filter state (selectedStatus, selectedRisk).
 */
export default function BountyAnalyticsCharts({ 
  records, 
  selectedStatus, 
  onStatusChange, 
  selectedRisk, 
  onRiskChange 
}) {
  // Compute Review Status Breakdown from records dataset
  const statusCounts = {
    VERIFIED: records.filter(r => (r.verificationStatus || r.defaultStatus) === 'VERIFIED').length,
    NEEDS_REVIEW: records.filter(r => (r.verificationStatus || r.defaultStatus) === 'NEEDS_REVIEW').length,
    DRAFT: records.filter(r => (r.verificationStatus || r.defaultStatus) === 'DRAFT').length,
    REJECTED: records.filter(r => (r.verificationStatus || r.defaultStatus) === 'REJECTED').length,
  };

  // Compute Risk Distribution Breakdown from records dataset
  const riskCounts = {
    LOW: records.filter(r => (r.riskLevel || '').toUpperCase() === 'LOW').length,
    MEDIUM: records.filter(r => (r.riskLevel || '').toUpperCase() === 'MEDIUM').length,
    HIGH: records.filter(r => (r.riskLevel || '').toUpperCase() === 'HIGH').length,
    CRITICAL: records.filter(r => (r.riskLevel || '').toUpperCase() === 'CRITICAL').length,
  };

  const total = records.length || 1;

  // Donut SVG Math
  const radius = 38;
  const circumference = 2 * Math.PI * radius; // ~238.76

  const segments = [
    { key: 'VERIFIED', label: 'VERIFIED', count: statusCounts.VERIFIED, color: '#10B981' },
    { key: 'NEEDS_REVIEW', label: 'NEEDS REVIEW', count: statusCounts.NEEDS_REVIEW, color: '#F59E0B' },
    { key: 'DRAFT', label: 'DRAFT', count: statusCounts.DRAFT, color: '#0EA5E9' },
    { key: 'REJECTED', label: 'REJECTED', count: statusCounts.REJECTED, color: '#F43F5E' },
  ];

  let accumulatedPercent = 0;
  const strokeSegments = segments.map((seg) => {
    const pct = seg.count / total;
    const strokeDasharray = `${pct * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedPercent * circumference;
    accumulatedPercent += pct;
    return { ...seg, strokeDasharray, strokeDashoffset };
  });

  return (
    <div className="py-2 space-y-4 font-mono">
      
      {/* Visual Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">
          RECORD BREAKDOWN & DASHBOARD CHARTS
        </span>
        <span className="text-[10px] text-slate-400">
          Click any chart segment to filter records
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        
        {/* CHART 1: Donut Chart - Review Status */}
        <div className="flex items-center gap-6 p-2">
          
          {/* Interactive SVG Donut */}
          <div className="relative w-28 h-28 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke="#1E293B"
                strokeWidth="14"
              />
              {strokeSegments.map((seg) => {
                if (seg.count === 0) return null;
                const isSelected = selectedStatus === seg.key;
                return (
                  <circle
                    key={seg.key}
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke={seg.color}
                    strokeWidth={isSelected ? "18" : "14"}
                    strokeDasharray={seg.strokeDasharray}
                    strokeDashoffset={seg.strokeDashoffset}
                    className="cursor-pointer transition-all hover:opacity-80"
                    onClick={() => onStatusChange(selectedStatus === seg.key ? 'ALL' : seg.key)}
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-lg font-bold text-white font-serif">{records.length}</span>
              <span className="text-[8px] text-slate-400 uppercase">RECORDS</span>
            </div>
          </div>

          {/* Donut Legend Items */}
          <div className="flex-1 space-y-1.5 text-xs">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              BY REVIEW STATUS
            </div>
            {segments.map((seg) => {
              const isSelected = selectedStatus === seg.key;
              return (
                <button
                  key={seg.key}
                  onClick={() => onStatusChange(selectedStatus === seg.key ? 'ALL' : seg.key)}
                  className={`w-full flex items-center justify-between px-2 py-1 rounded text-left transition-colors ${
                    isSelected ? 'bg-slate-800 text-white font-bold' : 'hover:bg-slate-900 text-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                    <span className="text-[11px]">{seg.label}</span>
                  </span>
                  <span className="text-[11px] font-bold" style={{ color: seg.color }}>{seg.count}</span>
                </button>
              );
            })}
          </div>

        </div>

        {/* CHART 2: Horizontal Bar Chart - Risk Distribution */}
        <div className="space-y-2 p-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            BY RISK CLASSIFICATION
          </div>

          {[
            { key: 'LOW', label: 'LOW RISK', count: riskCounts.LOW, color: 'bg-slate-600' },
            { key: 'MEDIUM', label: 'MEDIUM RISK', count: riskCounts.MEDIUM, color: 'bg-yellow-500' },
            { key: 'HIGH', label: 'HIGH RISK', count: riskCounts.HIGH, color: 'bg-amber-500' },
            { key: 'CRITICAL', label: 'CRITICAL RISK', count: riskCounts.CRITICAL, color: 'bg-rose-500' },
          ].map((bar) => {
            const isSelected = selectedRisk === bar.key;
            const pct = Math.max((bar.count / total) * 100, bar.count > 0 ? 8 : 0);

            return (
              <button
                key={bar.key}
                onClick={() => onRiskChange(selectedRisk === bar.key ? 'ALL' : bar.key)}
                className={`w-full space-y-1 p-1.5 rounded text-left transition-colors ${
                  isSelected ? 'bg-slate-800' : 'hover:bg-slate-900/60'
                }`}
              >
                <div className="flex justify-between text-[11px]">
                  <span className={`font-semibold ${isSelected ? 'text-amber-300' : 'text-slate-300'}`}>
                    {bar.label}
                  </span>
                  <span className="text-slate-400 font-bold">{bar.count}</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800 flex">
                  <div
                    className={`h-full transition-all duration-300 ${bar.color}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>

      </div>

    </div>
  );
}
