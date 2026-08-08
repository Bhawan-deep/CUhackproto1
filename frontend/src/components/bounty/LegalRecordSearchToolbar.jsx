import React from 'react';
import { Search, X, Filter, RotateCcw } from 'lucide-react';

export default function LegalRecordSearchToolbar({
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedJurisdiction,
  onJurisdictionChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  selectedRisk,
  onRiskChange,
  documentTypes,
  jurisdictions,
  categories,
  totalRecords,
  filteredRecordsCount,
  onClearFilters
}) {
  const hasActiveFilters = 
    searchQuery.trim() !== '' ||
    selectedType !== 'ALL' ||
    selectedJurisdiction !== 'ALL' ||
    selectedCategory !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    selectedRisk !== 'ALL';

  return (
    <div className="bg-[#0B1019] border border-slate-800 rounded-lg p-4 space-y-3 shadow-sm">
      
      {/* Top Row: Search Input & Result Counter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Search Field */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="SEARCH LEGAL RECORDS (ID, title, jurisdiction, clauses, notes)..."
            aria-label="Search legal records by ID, title, jurisdiction, clauses, or reviewer notes"
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded pl-9 pr-8 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none focus:text-amber-400"
              title="Clear search text"
              aria-label="Clear search input text"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Live Result Counter */}
        <div className="flex items-center gap-2 font-mono text-xs text-slate-400 shrink-0 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded">
          <span className="text-[10px] uppercase text-slate-400 tracking-wider">MATCHES:</span>
          <span className="font-bold text-amber-400">
            {filteredRecordsCount} / {totalRecords}
          </span>
          <span className="text-slate-400 text-[11px]">DOSSIERS</span>
        </div>

      </div>

      {/* Middle Row: Compact Filter Dropdowns */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-1">
        
        {/* Document Type */}
        <div className="space-y-1">
          <label htmlFor="filter-doc-type" className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
            TYPE
          </label>
          <select
            id="filter-doc-type"
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value)}
            aria-label="Filter legal records by document type"
            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-[11px] font-mono text-slate-200 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
          >
            <option value="ALL">ALL TYPES</option>
            {documentTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Jurisdiction */}
        <div className="space-y-1">
          <label htmlFor="filter-jurisdiction" className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
            JURISDICTION
          </label>
          <select
            id="filter-jurisdiction"
            value={selectedJurisdiction}
            onChange={(e) => onJurisdictionChange(e.target.value)}
            aria-label="Filter legal records by jurisdiction"
            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-[11px] font-mono text-slate-200 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
          >
            <option value="ALL">ALL JURISDICTIONS</option>
            {jurisdictions.map((j) => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div className="space-y-1">
          <label htmlFor="filter-category" className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
            CATEGORY
          </label>
          <select
            id="filter-category"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            aria-label="Filter legal records by category"
            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-[11px] font-mono text-slate-200 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
          >
            <option value="ALL">ALL CATEGORIES</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Verification Status */}
        <div className="space-y-1">
          <label htmlFor="filter-status" className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
            STATUS
          </label>
          <select
            id="filter-status"
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            aria-label="Filter legal records by verification status"
            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-[11px] font-mono text-slate-200 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
          >
            <option value="ALL">ALL STATUSES</option>
            <option value="DRAFT">DRAFT</option>
            <option value="NEEDS_REVIEW">NEEDS REVIEW</option>
            <option value="VERIFIED">VERIFIED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>

        {/* Risk Level */}
        <div className="space-y-1">
          <label htmlFor="filter-risk" className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
            RISK LEVEL
          </label>
          <select
            id="filter-risk"
            value={selectedRisk}
            onChange={(e) => onRiskChange(e.target.value)}
            aria-label="Filter legal records by risk level"
            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-[11px] font-mono text-slate-200 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
          >
            <option value="ALL">ALL RISKS</option>
            <option value="LOW">LOW RISK</option>
            <option value="MEDIUM">MEDIUM RISK</option>
            <option value="HIGH">HIGH RISK</option>
            <option value="CRITICAL">CRITICAL RISK</option>
          </select>
        </div>

      </div>

      {/* Bottom Row: Active Filter Badges & Reset Control */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-2.5 text-[11px] font-mono">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              ACTIVE FILTERS:
            </span>

            {searchQuery && (
              <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-1">
                SEARCH: "{searchQuery}"
              </span>
            )}

            {selectedType !== 'ALL' && (
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                TYPE: {selectedType}
              </span>
            )}

            {selectedJurisdiction !== 'ALL' && (
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                JURISDICTION: {selectedJurisdiction}
              </span>
            )}

            {selectedCategory !== 'ALL' && (
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                CATEGORY: {selectedCategory}
              </span>
            )}

            {selectedStatus !== 'ALL' && (
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                STATUS: {selectedStatus}
              </span>
            )}

            {selectedRisk !== 'ALL' && (
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                RISK: {selectedRisk}
              </span>
            )}
          </div>

          <button
            onClick={onClearFilters}
            aria-label="Clear all applied search filters and query text"
            className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-amber-400"
          >
            <RotateCcw className="w-3 h-3" />
            <span>CLEAR ALL</span>
          </button>
        </div>
      )}

    </div>
  );
}
