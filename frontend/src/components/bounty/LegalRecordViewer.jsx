import React, { useState, useEffect } from 'react';
import VerificationBadge from './VerificationBadge';
import ReviewBriefModal from './ReviewBriefModal';
import DossierExportControls from './DossierExportControls';
import { 
  Save, 
  CheckCircle, 
  FileText, 
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
      <div className="bg-[#0B1019] border border-slate-800 rounded-lg p-12 flex flex-col items-center justify-center text-center text-slate-400 gap-3 h-full font-mono text-xs">
        <FileText className="w-8 h-8 text-slate-600" />
        <p>Select a record from the table to inspect details.</p>
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
    <div className="bg-[#0B1019] border border-slate-800 rounded-lg flex flex-col h-full overflow-hidden shadow-sm font-sans">
      
      {/* Document Header */}
      <div className="p-6 border-b border-slate-800 bg-[#0E1524] space-y-3">
        
        <div className="flex flex-wrap items-center justify-between gap-3 font-mono">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-amber-400 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20">
              {record.id}
            </span>
            <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
              RECORD DOSSIER
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsBriefOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition-colors shadow-sm"
              title="Create Summary Brief"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>CREATE SUMMARY</span>
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
          <span>SYNTHETIC DEMONSTRATION RECORD — NOT LEGAL ADVICE</span>
        </div>

      </div>

      {/* Review Brief Modal */}
      {isBriefOpen && (
        <ReviewBriefModal
          record={record}
          onClose={() => setIsBriefOpen(false)}
        />
      )}

      {/* Main Document Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Document Actions Bar */}
        <DossierExportControls record={record} />

        {/* Metadata Section: "About this record" */}
        <div className="space-y-2">
          <h3 className="text-xs font-mono font-bold tracking-widest text-slate-300 uppercase border-b border-slate-800 pb-1.5">
            ABOUT THIS RECORD
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3.5 rounded bg-slate-900/60 border border-slate-800 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-semibold mb-0.5">
                Document type
              </span>
              <span className="text-slate-200 font-medium">
                {record.documentType || 'Not provided in record.'}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-semibold mb-0.5">
                Where it applies
              </span>
              <span className="text-slate-200 font-medium">
                {record.jurisdiction || 'Not provided in record.'}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-semibold mb-0.5">
                Category
              </span>
              <span className="text-slate-200 font-medium">
                {record.category || 'Not provided in record.'}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-semibold mb-0.5">
                Effective date
              </span>
              <span className="text-slate-200 font-medium">
                {record.effectiveDate || 'Not provided in record.'}
              </span>
            </div>
          </div>
        </div>

        {/* Clauses Section: "What the document says" */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono font-bold tracking-widest text-slate-300 uppercase border-b border-slate-800 pb-1.5">
            WHAT THE DOCUMENT SAYS
          </h3>

          {record.clauses && record.clauses.length > 0 ? (
            <div className="space-y-3 font-sans text-xs text-slate-300 leading-relaxed">
              {record.clauses.map((clause, idx) => (
                <div key={idx} className="p-3.5 rounded bg-slate-900/40 border border-slate-800/80 space-y-1">
                  <div className="font-mono text-[11px] font-bold text-amber-400">
                    {clause.section}
                  </div>
                  <p className="text-slate-200 leading-relaxed font-sans text-xs pt-0.5">
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

        {/* Review Form Section: "Review & Reviewer's notes" */}
        <form onSubmit={handleSave} className="border-t border-slate-800 pt-5 space-y-4 font-sans">
          
          <div className="flex items-center justify-between font-mono">
            <h3 className="text-xs font-bold tracking-widest text-slate-200 uppercase flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              REVIEW & REVIEWER'S NOTES
            </h3>
            {record.lastReviewedAt && (
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                Updated: {new Date(record.lastReviewedAt).toLocaleTimeString()}
              </span>
            )}
          </div>

          {/* Verification Status Selector */}
          <div className="space-y-1 font-mono">
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
              REVIEW STATUS
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full sm:w-64 bg-slate-900 border border-slate-700/80 rounded px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
            >
              <option value="DRAFT">DRAFT — Initial Draft</option>
              <option value="NEEDS_REVIEW">NEEDS REVIEW — Pending Check</option>
              <option value="VERIFIED">VERIFIED — Approved</option>
              <option value="REJECTED">REJECTED — Exception Flagged</option>
            </select>
          </div>

          {/* Reviewer's Notes */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono font-semibold text-slate-300 uppercase tracking-wider block">
              REVIEWER'S NOTES
            </label>
            <textarea
              rows={3}
              value={reviewerNotes}
              onChange={(e) => setReviewerNotes(e.target.value)}
              placeholder="Enter audit observations, reviewer notes, or rationale..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Save Action */}
          <div className="flex items-center gap-4 pt-1">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold rounded bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-sm disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'SAVING REVIEW...' : 'SAVE REVIEW'}</span>
            </button>

            {saveSuccess && (
              <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-3 py-1.5 rounded">
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Review state saved successfully.</span>
              </div>
            )}
          </div>

        </form>

      </div>

    </div>
  );
}
