import React, { useState } from 'react';
import { Download, Printer, CheckCircle, FileCode } from 'lucide-react';
import VerificationBadge from './VerificationBadge';
import { exportDossierJSON, triggerPrintPDF } from '../../utils/dossierExport';

export default function DossierExportControls({ record, size = 'normal' }) {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!record) return null;

  const handleJsonDownload = () => {
    const ok = exportDossierJSON(record);
    if (ok) {
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    }
  };

  const handlePdfPrint = () => {
    triggerPrintPDF();
  };

  return (
    <div className="bg-[#0B1019] border border-slate-800 rounded-lg p-3.5 space-y-3 print:hidden shadow-sm">
      
      {/* Header Metadata & Label */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-amber-400" />
          <span className="text-[10px] font-mono font-bold text-slate-200 uppercase tracking-widest">
            DOCUMENT ACTIONS & EXPORT
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold text-amber-400">
            {record.id}
          </span>
          <VerificationBadge status={record.verificationStatus} size="small" />
        </div>
      </div>

      {/* Action Buttons with Explanatory Sub-labels */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          
          {/* JSON Export Button */}
          <div className="space-y-0.5">
            <button
              onClick={handleJsonDownload}
              aria-label="Download legal dossier in JSON format"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold rounded bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
              title="Download Dossier as JSON File"
            >
              <Download className="w-3.5 h-3.5" />
              <span>DOWNLOAD JSON</span>
            </button>
            <span className="text-[9px] font-mono text-slate-400 block pl-0.5">
              Machine-readable JSON archive
            </span>
          </div>

          {/* PDF Print Button */}
          <div className="space-y-0.5">
            <button
              onClick={handlePdfPrint}
              aria-label="Print or save legal dossier as PDF"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold rounded bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition-colors shadow-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
              title="Print or Save Dossier as PDF Document"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>SAVE AS PDF</span>
            </button>
            <span className="text-[9px] font-mono text-slate-400 block pl-0.5">
              Print-ready PDF dossier
            </span>
          </div>

        </div>

        {downloadSuccess && (
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2.5 py-1 rounded">
            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{record.id}-review-dossier.json exported</span>
          </div>
        )}
      </div>

    </div>
  );
}
