import React, { useEffect } from 'react';
import VerificationBadge from './VerificationBadge';
import DossierExportControls from './DossierExportControls';
import { 
  X, 
  Info, 
  ShieldAlert, 
  CheckCircle2, 
  FileCheck
} from 'lucide-react';

export default function ReviewBriefModal({ record, onClose }) {
  // Escape key event listener for closing modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!record) return null;

  const notes = record.reviewerNotes || record.defaultNotes || '';
  const status = record.verificationStatus || record.defaultStatus || 'NEEDS_REVIEW';
  const risk = (record.riskLevel || 'LOW').toUpperCase();
  const clauses = record.clauses || [];

  // Compute factual metadata flags dynamically ("Things to notice")
  const flags = [];
  if (risk === 'HIGH' || risk === 'CRITICAL') {
    flags.push({ label: 'HIGH RISK RECORD', desc: `Risk Level classified as ${risk}` });
  }
  if (status === 'NEEDS_REVIEW' || status === 'DRAFT') {
    flags.push({ label: 'VERIFICATION PENDING', desc: `Current status is ${status.replace('_', ' ')}` });
  }
  if (notes.trim() !== '') {
    flags.push({ label: 'REVIEWER NOTES PRESENT', desc: 'Reviewer notes attached' });
  }
  if (clauses.length > 1) {
    flags.push({ label: 'MULTIPLE CLAUSES', desc: `${clauses.length} statutory clauses in record` });
  }
  if (record.effectiveDate) {
    flags.push({ label: 'EFFECTIVE DATE PRESENT', desc: `Effective: ${record.effectiveDate}` });
  }

  // Compute checklist statuses ("Check completed")
  const checklist = [
    { label: 'Record identity reviewed', done: Boolean(record.id && record.title) },
    { label: 'Where it applies reviewed', done: Boolean(record.jurisdiction) },
    { label: 'Document type reviewed', done: Boolean(record.documentType) },
    { label: 'Risk classification reviewed', done: Boolean(record.riskLevel) },
    { label: 'Document clauses reviewed', done: clauses.length > 0 },
    { label: 'Review status assigned', done: status !== 'DRAFT' },
    { label: 'Reviewer\'s notes reviewed', done: notes.trim() !== '' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto print:p-0 print:bg-white print:static print:block">
      
      {/* Print Specific CSS Override Rules */}
      <style>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .print\\:hidden, header, nav, footer {
            display: none !important;
          }
          .print-container {
            max-width: 100% !important;
            max-height: none !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          .print-border-dark {
            border-color: #cbd5e1 !important;
          }
          .print-bg-light {
            background-color: #f8fafc !important;
          }
        }
      `}</style>

      {/* Modal Shell */}
      <div className="print-container bg-[#0B0F19] border border-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-8 print:my-0 print:border-none print:shadow-none font-sans">
        
        {/* Modal Top Bar */}
        <div className="p-4 sm:px-6 border-b border-slate-800 bg-[#0E1524] flex items-center justify-between gap-4 print:hidden font-mono">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-widest text-amber-400 uppercase block">
                EXECUTIVE BRIEF SUMMARY
              </span>
              <h2 className="text-sm font-bold text-slate-100 tracking-wide uppercase">
                LEGAL REVIEW BRIEF — {record.id}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors"
            title="Close Brief"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Export Controls Toolbar inside Modal Header */}
        <div className="px-6 pt-4 print:hidden">
          <DossierExportControls record={record} />
        </div>

        {/* Modal Scrollable Document Content Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 text-slate-200 print:overflow-visible print:p-4 print:text-black">
          
          {/* Document Header & Title Block */}
          <div className="border-b border-slate-800 print-border-dark pb-6 space-y-4 font-mono">
            
            {/* Synthetic Disclaimer Banner */}
            <div className="flex items-center gap-2 text-xs text-amber-400 print:text-amber-700 bg-amber-950/40 print:bg-amber-50 border border-amber-800/60 print:border-amber-300 px-3.5 py-2 rounded">
              <Info className="w-4 h-4 shrink-0" />
              <span className="font-semibold">
                SYNTHETIC DEMONSTRATION RECORD — NOT LEGAL ADVICE
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div>
                <span className="text-xs font-bold text-amber-400 print:text-slate-800 tracking-wider">
                  RECORD DOSSIER ID: {record.id}
                </span>
                <h1 className="text-2xl font-bold text-white print:text-black tracking-tight font-serif mt-1">
                  {record.title}
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <VerificationBadge status={status} />
                <span className="text-xs font-bold px-2.5 py-1 rounded bg-slate-900 print:bg-slate-100 border border-slate-800 print:border-slate-300 text-slate-300 print:text-slate-800">
                  RISK: {risk}
                </span>
              </div>
            </div>

          </div>

          {/* SECTION 01: ABOUT THIS RECORD */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 print:text-slate-900 uppercase tracking-widest border-b border-slate-800/80 print-border-dark pb-2">
              <span className="text-slate-500">01</span>
              <span>ABOUT THIS RECORD</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-lg bg-slate-900/50 print-bg-light border border-slate-800 print-border-dark text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-400 print:text-slate-600 uppercase block font-semibold mb-1">
                  RECORD ID
                </span>
                <span className="text-slate-200 print:text-black font-bold">{record.id}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 print:text-slate-600 uppercase block font-semibold mb-1">
                  DOCUMENT TYPE
                </span>
                <span className="text-slate-200 print:text-black font-medium">
                  {record.documentType || 'NOT PROVIDED IN RECORD'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 print:text-slate-600 uppercase block font-semibold mb-1">
                  WHERE IT APPLIES
                </span>
                <span className="text-slate-200 print:text-black font-medium">
                  {record.jurisdiction || 'NOT PROVIDED IN RECORD'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 print:text-slate-600 uppercase block font-semibold mb-1">
                  CATEGORY
                </span>
                <span className="text-slate-200 print:text-black font-medium">
                  {record.category || 'NOT PROVIDED IN RECORD'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 print:text-slate-600 uppercase block font-semibold mb-1">
                  EFFECTIVE DATE
                </span>
                <span className="text-slate-200 print:text-black font-medium">
                  {record.effectiveDate || 'NOT PROVIDED IN RECORD'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 print:text-slate-600 uppercase block font-semibold mb-1">
                  RISK
                </span>
                <span className="text-amber-400 print:text-slate-900 font-bold">{risk}</span>
              </div>
            </div>
          </section>

          {/* SECTION 02: WHAT THE DOCUMENT SAYS */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 print:text-slate-900 uppercase tracking-widest border-b border-slate-800/80 print-border-dark pb-2">
              <span className="text-slate-500">02</span>
              <span>WHAT THE DOCUMENT SAYS</span>
            </div>

            {clauses.length > 0 ? (
              <div className="space-y-3">
                {clauses.map((clause, idx) => (
                  <div key={idx} className="p-4 rounded-lg bg-slate-900/40 print-bg-light border border-slate-800/80 print-border-dark space-y-1.5">
                    <div className="font-mono text-xs font-bold text-amber-400 print:text-slate-900 flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 print:bg-slate-200 text-[10px] text-slate-300 print:text-slate-800">
                        CLAUSE {idx + 1}
                      </span>
                      <span>{clause.section}</span>
                    </div>
                    <p className="text-xs text-slate-300 print:text-black font-sans leading-relaxed pt-1">
                      {clause.text}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-mono text-slate-400 italic p-3 bg-slate-900/30 rounded border border-slate-800">
                NO CLAUSES AVAILABLE IN RECORD
              </p>
            )}
          </section>

          {/* SECTION 03: REVIEW STATUS */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 print:text-slate-900 uppercase tracking-widest border-b border-slate-800/80 print-border-dark pb-2">
              <span className="text-slate-500">03</span>
              <span>REVIEW STATUS</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-900/50 print-bg-light border border-slate-800 print-border-dark text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-400 print:text-slate-600 uppercase block font-semibold mb-1">
                  CURRENT STATUS
                </span>
                <VerificationBadge status={status} size="small" />
              </div>

              <div>
                <span className="text-[10px] text-slate-400 print:text-slate-600 uppercase block font-semibold mb-1">
                  RISK RATING
                </span>
                <span className="text-slate-200 print:text-black font-bold">{risk}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 print:text-slate-600 uppercase block font-semibold mb-1">
                  WHERE IT APPLIES
                </span>
                <span className="text-slate-200 print:text-black font-medium truncate block">
                  {record.jurisdiction || 'NOT PROVIDED'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 print:text-slate-600 uppercase block font-semibold mb-1">
                  LAST REVIEWED
                </span>
                <span className="text-slate-300 print:text-black font-medium">
                  {record.lastReviewedAt ? new Date(record.lastReviewedAt).toLocaleTimeString() : 'INITIAL DEFAULTS'}
                </span>
              </div>
            </div>
          </section>

          {/* SECTION 04: THINGS TO NOTICE */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 print:text-slate-900 uppercase tracking-widest border-b border-slate-800/80 print-border-dark pb-2">
              <span className="text-slate-500">04</span>
              <span>THINGS TO NOTICE</span>
            </div>

            {flags.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                {flags.map((flag, idx) => (
                  <div key={idx} className="p-3 rounded bg-slate-900/60 print-bg-light border border-slate-800 print-border-dark flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400 print:text-slate-800 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-300 print:text-slate-900 block">{flag.label}</span>
                      <span className="text-[11px] text-slate-400 print:text-slate-700 font-sans">{flag.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-mono text-slate-400 italic p-3 bg-slate-900/30 rounded border border-slate-800">
                NO REVIEW FLAGS IDENTIFIED
              </p>
            )}
          </section>

          {/* SECTION 05: CHECK COMPLETED */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 print:text-slate-900 uppercase tracking-widest border-b border-slate-800/80 print-border-dark pb-2">
              <span className="text-slate-500">05</span>
              <span>CHECK COMPLETED</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs">
              {checklist.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded bg-slate-900/40 print-bg-light border border-slate-800 print-border-dark flex items-center justify-between gap-2">
                  <span className="text-slate-300 print:text-slate-800">{item.label}</span>
                  {item.done ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 print:text-emerald-700 px-2 py-0.5 rounded bg-emerald-950/60 print:bg-emerald-100 border border-emerald-800 print:border-emerald-300">
                      <CheckCircle2 className="w-3 h-3" /> COMPLETED
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-500 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                      PENDING
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 06: REVIEWER'S NOTES */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 print:text-slate-900 uppercase tracking-widest border-b border-slate-800/80 print-border-dark pb-2">
              <span className="text-slate-500">06</span>
              <span>REVIEWER'S NOTES</span>
            </div>

            {notes.trim() !== '' ? (
              <div className="p-4 rounded-lg bg-slate-900/60 print-bg-light border border-slate-800 print-border-dark space-y-2">
                <div className="text-[10px] font-mono text-slate-400 print:text-slate-600 uppercase tracking-wider font-semibold">
                  RECORDED REVIEWER ANNOTATION:
                </div>
                <p className="text-xs text-slate-200 print:text-black font-sans leading-relaxed whitespace-pre-wrap">
                  {notes}
                </p>
              </div>
            ) : (
              <p className="text-xs font-mono text-slate-400 italic p-4 bg-slate-900/30 rounded border border-slate-800">
                NO REVIEWER OBSERVATIONS RECORDED
              </p>
            )}
          </section>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:px-6 border-t border-slate-800 bg-[#0E1524] flex items-center justify-between text-xs font-mono text-slate-400 print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Summary Brief & Dossier Ready</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors font-bold"
          >
            CLOSE BRIEF
          </button>
        </div>

      </div>

    </div>
  );
}
