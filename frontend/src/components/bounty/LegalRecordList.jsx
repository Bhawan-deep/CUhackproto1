import React from 'react';
import VerificationBadge from './VerificationBadge';
import { FileCode, SearchX, RotateCcw } from 'lucide-react';

export default function LegalRecordList({ records, selectedRecordId, onSelectRecord, onClearFilters }) {
  const getRiskBadge = (risk) => {
    switch ((risk || '').toUpperCase()) {
      case 'CRITICAL':
        return 'bg-rose-950/60 text-rose-300 border-rose-800/80';
      case 'HIGH':
        return 'bg-amber-950/60 text-amber-300 border-amber-800/80';
      case 'MEDIUM':
        return 'bg-yellow-950/40 text-yellow-300 border-yellow-800/60';
      default:
        return 'bg-slate-900 text-slate-400 border-slate-800';
    }
  };

  return (
    <div className="bg-[#0B1019] border border-slate-800 rounded-lg flex flex-col h-full overflow-hidden shadow-sm">
      
      {/* List Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-[#0E1524]">
        <div>
          <h3 className="text-xs font-mono font-bold tracking-widest text-slate-200 uppercase flex items-center gap-2">
            <FileCode className="w-4 h-4 text-amber-400" />
            LEGAL RECORD DOSSIERS
          </h3>
          <span className="text-[10px] font-mono text-slate-400">
            {records.length} {records.length === 1 ? 'Record' : 'Records'} Displayed
          </span>
        </div>
      </div>

      {/* Record List Items / Empty State */}
      <div className="divide-y divide-slate-800/60 overflow-y-auto flex-1 max-h-[600px] min-h-[350px]">
        {records.length > 0 ? (
          records.map((rec) => {
            const isSelected = rec.id === selectedRecordId;

            return (
              <button
                key={rec.id}
                onClick={() => onSelectRecord(rec.id)}
                className={`w-full text-left p-4 transition-colors flex flex-col gap-2.5 ${
                  isSelected
                    ? 'bg-slate-800/60 border-l-2 border-l-amber-400'
                    : 'hover:bg-slate-900/60 border-l-2 border-l-transparent'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold text-amber-400/90 tracking-wider">
                    {rec.id}
                  </span>
                  <VerificationBadge status={rec.verificationStatus} size="small" />
                </div>

                <h4 className="text-xs font-semibold text-slate-100 line-clamp-1 font-serif">
                  {rec.title}
                </h4>

                <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
                  <span className="truncate">{rec.jurisdiction}</span>
                  <span className={`px-1.5 py-0.5 rounded border uppercase font-bold text-[9px] ${getRiskBadge(rec.riskLevel)}`}>
                    {rec.riskLevel} RISK
                  </span>
                </div>
              </button>
            );
          })
        ) : (
          /* Empty State for Zero Search Matches */
          <div className="p-8 flex flex-col items-center justify-center text-center gap-3 h-full my-auto">
            <div className="p-3 rounded-full bg-slate-900 border border-slate-800 text-amber-400">
              <SearchX className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-mono font-bold text-slate-200 uppercase tracking-wide">
                NO RECORDS MATCH
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed font-sans">
                The current investigation query produced no matching legal records. Try modifying your search term or clearing active filters.
              </p>
            </div>

            {onClearFilters && (
              <button
                onClick={onClearFilters}
                className="mt-2 flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 rounded transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>CLEAR FILTERS</span>
              </button>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
