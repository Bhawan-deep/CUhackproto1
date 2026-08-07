import React, { useState } from 'react';
import { Activity, Radio, ChevronRight, Zap } from 'lucide-react';

export default function LiveEventFeed({ causalSummary, onSelectEntity }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!causalSummary) return null;

  const headline = causalSummary.headline || "Normal economic equilibrium.";
  const changes = causalSummary.major_changes || [];

  return (
    <div className="bg-[#0D1424]/90 border border-slate-800 rounded-xl p-3 shadow-xl backdrop-blur-md font-mono text-xs max-w-sm w-full space-y-2">
      {/* Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between cursor-pointer select-none border-b border-slate-800 pb-2"
      >
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span className="font-bold text-slate-200 text-xs tracking-wide">LIVE EVENT STREAM</span>
        </div>
        <span className="text-[10px] text-slate-400">
          {isExpanded ? 'Collapse' : 'Expand'}
        </span>
      </div>

      {/* Main Headline */}
      <p className="text-amber-300 font-semibold text-xs leading-snug">
        {headline}
      </p>

      {/* Expanded Bullet Points */}
      {isExpanded && changes.length > 0 && (
        <div className="space-y-1.5 pt-1">
          {changes.map((item, idx) => (
            <div
              key={idx}
              onClick={() => onSelectEntity && onSelectEntity(item)}
              className="p-1.5 rounded bg-slate-950/80 border border-slate-800/80 hover:border-amber-500/40 text-[11px] text-slate-300 flex items-center justify-between cursor-pointer transition-colors"
            >
              <span className="truncate pr-2">{item}</span>
              <ChevronRight className="w-3 h-3 text-slate-500 flex-shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
