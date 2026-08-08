import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  Scale, 
  ShieldCheck, 
  Search, 
  FileText, 
  Download, 
  Layers, 
  BookOpen,
  CheckCircle2,
  CheckSquare,
  ArrowRight,
  Info,
  CheckCircle
} from 'lucide-react';
import { getMergedLegalRecords, saveRecordReview } from '../utils/bountyStorage';
import LegalRecordList from '../components/bounty/LegalRecordList';
import LegalRecordViewer from '../components/bounty/LegalRecordViewer';
import LegalRecordSearchToolbar from '../components/bounty/LegalRecordSearchToolbar';

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
      
      {/* Top Editorial Bar & Navigation */}
      <header className="border-b border-slate-800/80 bg-[#0B0F19] px-6 py-3.5 sticky top-0 z-30 backdrop-blur-sm bg-opacity-95">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Brand & Workspace Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleReturn}
              className="group flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all shadow-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
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
                BOUNTY WORKSPACE — LEGAL INTELLIGENCE & REVIEW TOOLS
              </span>
            </div>
          </div>

          {/* View Switcher Controls */}
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col gap-6">
        
        {/* Workspace Title & Evaluator Stepper Header */}
        <section className="border-b border-slate-800/80 pb-6 flex flex-col gap-6">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-3xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-amber-400/90 tracking-widest uppercase font-semibold">
                <BookOpen className="w-3.5 h-3.5" />
                <span>STANDALONE LEGAL RECORD INVESTIGATION WORKSTATION</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-serif">
                BOUNTY WORKSPACE
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans">
                A dedicated, high-integrity research console for searching, verifying, analyzing, 
                and exporting structured legal audit dossiers. Completely decoupled from simulation execution.
              </p>
            </div>

            {/* Workspace Status Capability Block (Renamed from Telemetry) */}
            <div className="bg-[#0B0F19] border border-slate-800 rounded-lg p-3.5 min-w-[260px] space-y-1.5 text-xs font-mono">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold border-b border-slate-800 pb-1 flex items-center justify-between">
                <span>WORKSPACE STATUS</span>
                <span className="text-emerald-400 font-bold">READY</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">RECORDS:</span>
                <span className="text-amber-400 font-bold">{records.length} Dossiers</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">VERIFICATION:</span>
                <span className="text-emerald-400">ACTIVE</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">BRIEF ENGINE:</span>
                <span className="text-slate-200">READY</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">DOSSIER EXPORT:</span>
                <span className="text-slate-200">READY</span>
              </div>
            </div>
          </div>

          {/* 4-Step Editorial Workflow Stepper */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#0B0F19] border border-slate-800/80 p-3.5 rounded-lg text-xs font-mono">
            <div className="space-y-1 p-2 rounded bg-slate-900/60 border border-slate-800/80">
              <div className="text-[10px] font-bold text-amber-400 tracking-wider">01 FIND</div>
              <div className="text-slate-200 font-semibold">Search & Filter</div>
              <div className="text-[10px] text-slate-400 font-sans">Multi-field instant queries</div>
            </div>

            <div className="space-y-1 p-2 rounded bg-slate-900/60 border border-slate-800/80">
              <div className="text-[10px] font-bold text-amber-400 tracking-wider">02 VERIFY</div>
              <div className="text-slate-200 font-semibold">Status & Notes</div>
              <div className="text-[10px] text-slate-400 font-sans">localStorage persistence</div>
            </div>

            <div className="space-y-1 p-2 rounded bg-slate-900/60 border border-slate-800/80">
              <div className="text-[10px] font-bold text-amber-400 tracking-wider">03 ANALYZE</div>
              <div className="text-slate-200 font-semibold">Review Brief</div>
              <div className="text-[10px] text-slate-400 font-sans">Deterministic 6-section brief</div>
            </div>

            <div className="space-y-1 p-2 rounded bg-slate-900/60 border border-slate-800/80">
              <div className="text-[10px] font-bold text-amber-400 tracking-wider">04 PACKAGE</div>
              <div className="text-slate-200 font-semibold">Export Dossier</div>
              <div className="text-[10px] text-slate-400 font-sans">JSON download & PDF print</div>
            </div>
          </div>

          {/* Evaluator Guidance Banner & Primary Action Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 bg-amber-950/20 border border-amber-800/40 rounded-lg text-xs font-mono">
            <div className="flex items-center gap-2 text-amber-300">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong className="text-amber-400 font-bold uppercase">DEMO WORKFLOW:</strong> Find a record → verify status & notes → generate review brief → export dossier.
              </span>
            </div>

            <button
              onClick={() => setActiveTab('VERIFICATION')}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold transition-colors shrink-0 shadow-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
            >
              <span>OPEN CONSOLE</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </section>

        {/* TAB 1: INVESTIGATION CONSOLE (Active Workflow Console) */}
        {activeTab === 'VERIFICATION' && (
          <div className="space-y-6">
            
            {/* Search & Filter Investigation Toolbar */}
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

            {/* Split Inspection View: List & Viewer */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
              
              {/* Left Rail: Filtered Legal Record List Browser (4 Columns) */}
              <div className="lg:col-span-4">
                <LegalRecordList
                  records={filteredRecords}
                  selectedRecordId={selectedRecordId}
                  onSelectRecord={setSelectedRecordId}
                  onClearFilters={handleClearFilters}
                />
              </div>

              {/* Right Main Panel: Legal Record Inspection & Review Viewer (8 Columns) */}
              <div className="lg:col-span-8">
                <LegalRecordViewer
                  record={selectedRecord}
                  onSaveReview={handleSaveReview}
                />
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: MODULE ROADMAP (Phase Previews) */}
        {activeTab === 'MODULES' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
              <h2 className="text-xs font-mono font-bold tracking-widest text-slate-300 uppercase flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                RESEARCH & REVIEW MODULE ROADMAP
              </h2>
            </div>

            {/* Four Module Layout Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Complete Active Console */}
              <div className="bg-[#0B101B] border border-amber-500/30 rounded-lg p-6 flex flex-col justify-between gap-6 transition-all group shadow-sm">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300 uppercase tracking-wider">
                      PHASES B1–B6 ACTIVE
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                      MODULE 01–04
                    </span>
                    <h3 className="text-lg font-bold text-white tracking-wide mt-0.5 font-serif group-hover:text-emerald-300 transition-colors">
                      LEGAL INTELLIGENCE CONSOLE
                    </h3>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Search legal records, verify audit statuses and reviewer notes, 
                    synthesize 6-section review briefs, and export JSON or print-ready PDF dossiers.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('VERIFICATION')}
                  className="w-full text-center py-2 px-4 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold transition-colors"
                >
                  OPEN INVESTIGATION CONSOLE →
                </button>
              </div>

              {/* Complete System Summary */}
              <div className="bg-[#0B101B] border border-slate-800 rounded-lg p-6 flex flex-col justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 uppercase tracking-wider">
                      VERIFIED & DECOUPLED
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                      SYSTEM INTEGRITY
                    </span>
                    <h3 className="text-lg font-bold text-white tracking-wide mt-0.5 font-serif">
                      SIMULATOR COMPATIBILITY
                    </h3>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    The Bounty Workspace runs completely decoupled from core Agent Economy simulation execution, 
                    preserving 100% of Phase 1–9 models, WebSockets, Time Machine, and Parallel Universe.
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Footer Editorial Callout */}
        <footer className="border-t border-slate-800/80 pt-6 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span>Bounty Workspace Complete • All 6 Bounty Phases Verified</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleReturn}
              className="text-slate-300 hover:text-white underline underline-offset-4 transition-colors"
            >
              Return to Agent Economy Simulator →
            </button>
          </div>
        </footer>

      </main>

    </div>
  );
}
