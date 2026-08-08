import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  Scale, 
  Layers, 
  CheckCircle2, 
  CheckSquare,
  ArrowRight,
  Info
} from 'lucide-react';
import { getMergedLegalRecords, saveRecordReview } from '../utils/bountyStorage';
import LegalRecordList from '../components/bounty/LegalRecordList';
import LegalRecordViewer from '../components/bounty/LegalRecordViewer';
import LegalRecordSearchToolbar from '../components/bounty/LegalRecordSearchToolbar';
import BountyAnalyticsCharts from '../components/bounty/BountyAnalyticsCharts';

export default function BountyWorkspace({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('VERIFICATION'); // 'VERIFICATION' | 'MODULES'
  const [records, setRecords] = useState([]);
  const [selectedRecordId, setSelectedRecordId] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedRisk, setSelectedRisk] = useState('ALL');

  // Load records and merged localStorage review states on mount
  useEffect(() => {
    const loaded = getMergedLegalRecords();
    setRecords(loaded);
    if (loaded.length > 0 && !selectedRecordId) {
      setSelectedRecordId(loaded[0].id);
    }
  }, []);

  const handleSaveReview = (recordId, status, reviewerNotes) => {
    saveRecordReview(recordId, status, reviewerNotes);
    // Refresh merged records state immediately
    const updated = getMergedLegalRecords();
    setRecords(updated);
  };

  // Derive unique filter dropdown values from dataset
  const documentTypes = useMemo(() => Array.from(new Set(records.map(r => r.documentType).filter(Boolean))), [records]);
  const jurisdictions = useMemo(() => Array.from(new Set(records.map(r => r.jurisdiction).filter(Boolean))), [records]);
  const categories = useMemo(() => Array.from(new Set(records.map(r => r.category).filter(Boolean))), [records]);

  // Composed AND filter & search execution
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      // 1. Keyword search (across id, title, documentType, jurisdiction, category, riskLevel, notes, clauses)
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const clausesText = (rec.clauses || []).map(c => `${c.section} ${c.text}`).join(' ').toLowerCase();
        const fullText = `
          ${rec.id} 
          ${rec.title} 
          ${rec.documentType} 
          ${rec.jurisdiction} 
          ${rec.category} 
          ${rec.riskLevel} 
          ${rec.verificationStatus} 
          ${rec.reviewerNotes || ''} 
          ${clausesText}
        `.toLowerCase();

        if (!fullText.includes(q)) {
          return false;
        }
      }

      // 2. Document Type
      if (selectedType !== 'ALL' && rec.documentType !== selectedType) {
        return false;
      }

      // 3. Jurisdiction
      if (selectedJurisdiction !== 'ALL' && rec.jurisdiction !== selectedJurisdiction) {
        return false;
      }

      // 4. Category
      if (selectedCategory !== 'ALL' && rec.category !== selectedCategory) {
        return false;
      }

      // 5. Verification Status
      if (selectedStatus !== 'ALL' && rec.verificationStatus !== selectedStatus) {
        return false;
      }

      // 6. Risk Level
      if (selectedRisk !== 'ALL' && (rec.riskLevel || '').toUpperCase() !== selectedRisk.toUpperCase()) {
        return false;
      }

      return true;
    });
  }, [records, searchQuery, selectedType, selectedJurisdiction, selectedCategory, selectedStatus, selectedRisk]);

  // Ensure selected record remains valid when filters change
  useEffect(() => {
    if (filteredRecords.length > 0) {
      const exists = filteredRecords.some(r => r.id === selectedRecordId);
      if (!exists) {
        setSelectedRecordId(filteredRecords[0].id);
      }
    }
  }, [filteredRecords, selectedRecordId]);

  const selectedRecord = records.find((r) => r.id === selectedRecordId) || filteredRecords[0] || null;

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedType('ALL');
    setSelectedJurisdiction('ALL');
    setSelectedCategory('ALL');
    setSelectedStatus('ALL');
    setSelectedRisk('ALL');
  };

  const handleReturn = () => {
    if (onNavigate) {
      onNavigate('/');
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-[#070A11] text-slate-200 font-sans flex flex-col selection:bg-amber-500/20 selection:text-amber-200">
      
      {/* Top Bar Navigation */}
      <header className="border-b border-slate-800 bg-[#0B0F19] px-6 py-3.5 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Brand & Workspace Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleReturn}
              className="group flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-medium rounded text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-800 transition-all shadow-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
              title="Return to Agent Economy Simulator"
              aria-label="Return to Agent Economy Simulator"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-400 group-hover:-translate-x-0.5 transition-transform" />
              <span>RETURN TO SIMULATOR</span>
            </button>

            <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Scale className="w-4 h-4" />
              </div>
              <span className="text-xs font-mono font-semibold tracking-wider text-slate-300 uppercase">
                BOUNTY WORKSPACE — CHECK AND REVIEW LEGAL RECORDS
              </span>
            </div>
          </div>

          {/* View Switcher */}
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <div className="flex bg-slate-900 border border-slate-800 p-0.5 rounded">
              <button
                onClick={() => setActiveTab('VERIFICATION')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 focus:outline-none ${
                  activeTab === 'VERIFICATION' 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>INVESTIGATION CONSOLE</span>
              </button>

              <button
                onClick={() => setActiveTab('MODULES')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 focus:outline-none ${
                  activeTab === 'MODULES' 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>MODULE ROADMAP</span>
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 flex flex-col gap-6">
        
        {/* Top Visual Summary & Process Stepper Section */}
        <section className="border-b border-slate-800 pb-5 space-y-4">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-serif">
                BOUNTY WORKSPACE
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 font-sans">
                Find a record, check it, understand it, and save the result. ({records.length} demonstration records available)
              </p>
            </div>

            {/* Compact Inline Factual Statistics (Typography & Separators - No Cards) */}
            <div className="flex items-center gap-4 text-xs font-mono text-slate-300 border-t md:border-t-0 border-slate-800 pt-3 md:pt-0">
              <div className="text-center">
                <span className="text-[10px] text-slate-500 block uppercase">TOTAL RECORDS</span>
                <span className="text-sm font-bold text-slate-200">{records.length}</span>
              </div>
              <div className="h-6 w-[1px] bg-slate-800" />
              <div className="text-center">
                <span className="text-[10px] text-slate-500 block uppercase">NEEDS CHECKING</span>
                <span className="text-sm font-bold text-amber-400">
                  {records.filter(r => (r.verificationStatus || r.defaultStatus) === 'NEEDS_REVIEW').length}
                </span>
              </div>
              <div className="h-6 w-[1px] bg-slate-800" />
              <div className="text-center">
                <span className="text-[10px] text-slate-500 block uppercase">VERIFIED</span>
                <span className="text-sm font-bold text-emerald-400">
                  {records.filter(r => (r.verificationStatus || r.defaultStatus) === 'VERIFIED').length}
                </span>
              </div>
              <div className="h-6 w-[1px] bg-slate-800" />
              <div className="text-center">
                <span className="text-[10px] text-slate-500 block uppercase">HIGH RISK</span>
                <span className="text-sm font-bold text-rose-400">
                  {records.filter(r => (r.riskLevel || '').toUpperCase() === 'HIGH' || (r.riskLevel || '').toUpperCase() === 'CRITICAL').length}
                </span>
              </div>
            </div>
          </div>

          {/* Compact Editorial Process Stepper: 01 FIND ───── 02 CHECK ───── 03 SUMMARIZE ───── 04 SAVE */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-3 font-mono text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold">01 FIND</span>
              <span className="text-slate-300">Search & filter</span>
            </div>
            <span className="text-slate-700 hidden sm:inline">─────</span>
            
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold">02 CHECK</span>
              <span className="text-slate-300">Status & notes</span>
            </div>
            <span className="text-slate-700 hidden sm:inline">─────</span>
            
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold">03 SUMMARIZE</span>
              <span className="text-slate-300">Review brief</span>
            </div>
            <span className="text-slate-700 hidden sm:inline">─────</span>

            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold">04 SAVE</span>
              <span className="text-slate-300">Export dossier</span>
            </div>
          </div>

        </section>

        {/* TAB 1: INVESTIGATION CONSOLE */}
        {activeTab === 'VERIFICATION' && (
          <div className="space-y-6">
            
            {/* Interactive SVG Analytics Charts */}
            <BountyAnalyticsCharts
              records={records}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              selectedRisk={selectedRisk}
              onRiskChange={setSelectedRisk}
            />

            {/* Search & Filter Toolbar */}
            <LegalRecordSearchToolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedType={selectedType}
              onTypeChange={setSelectedType}
              selectedJurisdiction={selectedJurisdiction}
              onJurisdictionChange={setSelectedJurisdiction}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              selectedRisk={selectedRisk}
              onRiskChange={setSelectedRisk}
              documentTypes={documentTypes}
              jurisdictions={jurisdictions}
              categories={categories}
              totalRecords={records.length}
              filteredRecordsCount={filteredRecords.length}
              onClearFilters={handleClearFilters}
            />

            {/* Split Data View: Record Table & Document Inspector */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px]">
              
              {/* Left Main Table (5 Columns) */}
              <div className="lg:col-span-5">
                <LegalRecordList
                  records={filteredRecords}
                  selectedRecordId={selectedRecordId}
                  onSelectRecord={setSelectedRecordId}
                  onClearFilters={handleClearFilters}
                />
              </div>

              {/* Right Document Inspector (7 Columns) */}
              <div className="lg:col-span-7">
                <LegalRecordViewer
                  record={selectedRecord}
                  onSaveReview={handleSaveReview}
                />
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: MODULE ROADMAP */}
        {activeTab === 'MODULES' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 font-mono">
              <span className="text-xs font-bold tracking-widest text-slate-300 uppercase">
                RESEARCH & REVIEW MODULE ROADMAP
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
              <div className="bg-[#0B101B] border border-amber-500/30 rounded-lg p-6 space-y-4">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300 uppercase">
                  PHASES B1–B7 ACTIVE
                </span>
                <h3 className="text-lg font-bold text-white font-serif">
                  LEGAL DATA INVESTIGATION WORKSTATION
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Interactive charts, search filtering, document checking, summary brief generation, 
                  and JSON/PDF dossier export capabilities.
                </p>
                <button
                  onClick={() => setActiveTab('VERIFICATION')}
                  className="w-full text-center py-2 px-4 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold transition-colors"
                >
                  OPEN INVESTIGATION CONSOLE →
                </button>
              </div>

              <div className="bg-[#0B101B] border border-slate-800 rounded-lg p-6 space-y-4">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 uppercase">
                  SIMULATOR DECOUPLED
                </span>
                <h3 className="text-lg font-bold text-white font-serif">
                  SIMULATOR COMPATIBILITY
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Runs completely decoupled from core Agent Economy simulation execution, 
                  preserving 100% of Phase 1–9 models, WebSockets, Time Machine, and Parallel Universe.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer Editorial Callout */}
        <footer className="border-t border-slate-800 pt-5 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span>Bounty Workspace — Interactive Legal Data Investigation Dashboard Complete</span>
          </div>
          <button
            onClick={handleReturn}
            className="text-slate-300 hover:text-white underline underline-offset-4 transition-colors"
          >
            Return to Agent Economy Simulator →
          </button>
        </footer>

      </main>

    </div>
  );
}
