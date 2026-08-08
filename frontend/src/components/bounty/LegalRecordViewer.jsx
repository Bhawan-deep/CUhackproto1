import React, { useState, useEffect } from 'react';
import VerificationBadge from './VerificationBadge';
import ReviewBriefModal from './ReviewBriefModal';
import DossierExportControls from './DossierExportControls';
import { 
  Save, 
  CheckCircle, 
  FileText, 
  Building2, 
  Globe, 
  Calendar, 
  AlertTriangle,
  Info,
  Clock,
  FileCheck
} from 'lucide-react';

export default function LegalRecordViewer({ record, onSaveReview }) {
  const [status, setStatus] = useState(record?.verificationStatus || 'NEEDS_REVIEW');
  const [reviewerNotes, setReviewerNotes] = useState(record?.reviewerNotes || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isBriefOpen, setIsBriefOpen] = useState(false);

  // Sync state whenever selected record changes
  useEffect(() => {
    if (record) {
      setStatus(record.verificationStatus || 'NEEDS_REVIEW');
      setReviewerNotes(record.reviewerNotes || '');
      setSaveSuccess(false);
    }
  }, [record?.id, record?.verificationStatus, record?.reviewerNotes]);

  if (!record) {
    return (
      <div className="bg-[#0B1019] border border-slate-800 rounded-lg p-12 flex flex-col items-center justify-center text-center text-slate-400 gap-3 h-full">
        <FileText className="w-8 h-8 text-slate-600" />
        <p className="text-sm font-mono">Select a legal record dossier to begin verification review.</p>
      </div>
    );
  }

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    if (onSaveReview) {
      onSaveReview(record.id, status, reviewerNotes);
    }

    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    }, 200);
  };

  return (
    <div className="bg-[#0B1019] border border-slate-800 rounded-lg flex flex-col h-full overflow-hidden shadow-sm">
      
      {/* Viewer Header */}
      <div className="p-6 border-b border-slate-800/80 bg-[#0E1524] space-y-4">
        
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono font-bold text-amber-400 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20">
              {record.id}
            </span>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest font-semibold">
              LEGAL AUDIT DOSSIER
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsBriefOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition-colors shadow-sm"
              title="Generate Legal Review Brief"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>GENERATE REVIEW BRIEF</span>
            </button>

            <VerificationBadge status={record.verificationStatus} />
          </div>
        </div>

        <h2 className="text-xl font-bold text-white tracking-tight font-serif leading-snug">
          {record.title}
        </h2>

        {/* Demo Data Disclaimer */}
        <div className="flex items-center gap-2 text-[11px] font-mono text-amber-400/90 bg-amber-950/30 border border-amber-800/40 px-3 py-1.5 rounded">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>SAMPLE DEMO RECORD — Synthetic audit document for verification workflow testing.</span>
        </div>

      </div>

      {/* Review Brief Modal */}
      {isBriefOpen && (
        <ReviewBriefModal
          record={record}
          onClose={() => setIsBriefOpen(false)}
        />
      )}


      {/* Main Body & Metadata Rail */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Export Controls Bar */}
        <DossierExportControls record={record} />

        {/* Metadata Rail Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs font-mono">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-1">
              DOCUMENT TYPE
            </span>
            <span className="text-slate-200 font-medium">
              {record.documentType || 'Not provided in record.'}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-1">
              JURISDICTION
            </span>
            <span className="text-slate-200 font-medium">
              {record.jurisdiction || 'Not provided in record.'}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-1">
              CATEGORY
            </span>
            <span className="text-slate-200 font-medium">
              {record.category || 'Not provided in record.'}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-1">
              EFFECTIVE DATE
            </span>
            <span className="text-slate-200 font-medium">
              {record.effectiveDate || 'Not provided in record.'}
            </span>
          </div>
        </div>

        {/* Clauses & Text Section */}
        <div className="space-y-4">
          <h3 className="text-xs font-mono font-bold tracking-widest text-slate-300 uppercase border-b border-slate-800 pb-2">
            STATUTORY CLAUSES & RECORD BODY
          </h3>

          {record.clauses && record.clauses.length > 0 ? (
            <div className="space-y-3 font-serif text-xs text-slate-300 leading-relaxed">
              {record.clauses.map((clause, idx) => (
                <div key={idx} className="p-3.5 rounded bg-slate-900/40 border border-slate-800/60 space-y-1">
                  <div className="font-mono text-[11px] font-bold text-amber-400">
                    {clause.section}
                  </div>
                  <p className="text-slate-200 leading-relaxed font-sans text-xs">
                    {clause.text}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs font-mono text-slate-400 italic">
              Not provided in record.
            </p>
          )}
        </div>

        {/* Dedicated Review & Verification Section */}
        <form onSubmit={handleSave} className="border-t border-slate-800/80 pt-6 space-y-4">
          
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold tracking-widest text-slate-200 uppercase flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              VERIFICATION STATUS & REVIEWER ANNOTATION
            </h3>
            {record.lastReviewedAt && (
              <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                Updated: {new Date(record.lastReviewedAt).toLocaleTimeString()}
              </span>
            )}
          </div>

          {/* Verification Status Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono font-semibold text-slate-300 uppercase tracking-wider block">
              VERIFICATION STATUS
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full sm:w-64 bg-slate-900 border border-slate-700/80 rounded px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-400"
            >
              <option value="DRAFT">DRAFT — Initial Draft</option>
              <option value="NEEDS_REVIEW">NEEDS_REVIEW — Pending Audit Review</option>
              <option value="VERIFIED">VERIFIED — Audit Approved</option>
              <option value="REJECTED">REJECTED — Audit Exception</option>
            </select>
          </div>

          {/* Reviewer Notes */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono font-semibold text-slate-300 uppercase tracking-wider block">
              REVIEWER NOTES
            </label>
            <textarea
              rows={3}
              value={reviewerNotes}
              onChange={(e) => setReviewerNotes(e.target.value)}
              placeholder="Enter audit observations, compliance verification notes, or rejection rationale..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded p-3 text-xs font-sans text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Save Action & Feedback */}
          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold rounded bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-sm disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'SAVING REVIEW...' : 'SAVE REVIEW'}</span>
            </button>

            {saveSuccess && (
              <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-3 py-1.5 rounded animate-fade-in">
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Review state saved successfully to localStorage.</span>
              </div>
            )}
          </div>

        </form>

      </div>

    </div>
  );
}
