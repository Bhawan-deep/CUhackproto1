import React from 'react';
import VerificationBadge from './VerificationBadge';
import { SearchX, RotateCcw } from 'lucide-react';

export default function LegalRecordList({ records, selectedRecordId, onSelectRecord, onClearFilters }) {
  const getRiskBadge = (risk) => {
    switch ((risk || '').toUpperCase()) {
      case 'CRITICAL':
        return 'text-rose-400 font-bold';
      case 'HIGH':
        return 'text-amber-400 font-bold';
      case 'MEDIUM':
        return 'text-yellow-400 font-semibold';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="bg-[#0B1019] border border-slate-800 rounded-lg flex flex-col h-full overflow-hidden shadow-sm">
      
      {/* Table Header */}
      <div className="px-4 py-3 border-b border-slate-800 bg-[#0E1524] flex items-center justify-between font-mono">
        <div>
          <span className="text-xs font-bold tracking-widest text-slate-200 uppercase">
            LEGAL RECORD DOSSIERS
          </span>
          <span className="text-[10px] text-slate-400 block font-sans">
            {records.length} {records.length === 1 ? 'record found' : 'records found'}
          </span>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-y-auto flex-1 max-h-[580px] min-h-[300px]">
        {records.length > 0 ? (
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-4 font-semibold">ID</th>
                <th className="py-2.5 px-4 font-semibold">RECORD TITLE</th>
                <th className="py-2.5 px-4 font-semibold hidden sm:table-cell">WHERE IT APPLIES</th>
                <th className="py-2.5 px-4 font-semibold">RISK</th>
                <th className="py-2.5 px-4 font-semibold">REVIEW STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {records.map((rec) => {
                const isSelected = rec.id === selectedRecordId;

                return (
                  <tr
                    key={rec.id}
                    onClick={() => onSelectRecord(rec.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-slate-800/80 border-l-4 border-l-amber-400'
                        : 'hover:bg-slate-900/60 border-l-4 border-l-transparent'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-amber-400 whitespace-nowrap">
                      {rec.id}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-100 max-w-[200px] truncate font-serif">
                      {rec.title}
                    </td>
                    <td className="py-3 px-4 text-slate-400 hidden sm:table-cell truncate max-w-[150px] font-mono text-[11px]">
                      {rec.jurisdiction}
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] uppercase whitespace-nowrap">
                      <span className={getRiskBadge(rec.riskLevel)}>
                        {rec.riskLevel}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <VerificationBadge status={rec.verificationStatus} size="small" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
