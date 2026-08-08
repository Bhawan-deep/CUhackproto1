import { getStoredReviews } from './bountyStorage';

/**
 * Generate and trigger download of a structured JSON dossier for a legal record.
 * Merges latest stored verification status and reviewer notes.
 */
export function exportDossierJSON(record) {
  if (!record) return false;

  // Retrieve latest persisted verification state from localStorage
  const storedReviews = getStoredReviews();
  const stored = storedReviews[record.id] || {};

  const status = stored.status || record.verificationStatus || record.defaultStatus || 'NEEDS_REVIEW';
  const notes = stored.reviewerNotes !== undefined 
    ? stored.reviewerNotes 
    : (record.reviewerNotes || record.defaultNotes || '');
  const risk = (record.riskLevel || 'LOW').toUpperCase();
  const clauses = record.clauses || [];

  // Compute factual metadata flags
  const reviewFlags = [];
  if (risk === 'HIGH' || risk === 'CRITICAL') {
    reviewFlags.push({ flag: 'HIGH_RISK_RECORD', description: `Risk level classified as ${risk}` });
  }
  if (status === 'NEEDS_REVIEW' || status === 'DRAFT') {
    reviewFlags.push({ flag: 'VERIFICATION_PENDING', description: `Current status is ${status}` });
  }
  if (notes.trim() !== '') {
    reviewFlags.push({ flag: 'REVIEWER_NOTES_PRESENT', description: 'Reviewer observations recorded' });
  }
  if (clauses.length > 1) {
    reviewFlags.push({ flag: 'MULTIPLE_CLAUSES', description: `${clauses.length} statutory clauses in record` });
  }
  if (record.effectiveDate) {
    reviewFlags.push({ flag: 'EFFECTIVE_DATE_PRESENT', description: `Effective date: ${record.effectiveDate}` });
  }

  // Compute factual review checklist items
  const reviewChecklist = [
    { item: 'Record identity reviewed', status: Boolean(record.id && record.title) ? 'VERIFIED' : 'PENDING' },
    { item: 'Jurisdiction reviewed', status: Boolean(record.jurisdiction) ? 'VERIFIED' : 'PENDING' },
    { item: 'Document type reviewed', status: Boolean(record.documentType) ? 'VERIFIED' : 'PENDING' },
    { item: 'Risk classification reviewed', status: Boolean(record.riskLevel) ? 'VERIFIED' : 'PENDING' },
    { item: 'Clauses reviewed', status: clauses.length > 0 ? 'VERIFIED' : 'PENDING' },
    { item: 'Verification status assigned', status: status !== 'DRAFT' ? 'VERIFIED' : 'PENDING' },
    { item: 'Reviewer notes reviewed', status: notes.trim() !== '' ? 'VERIFIED' : 'PENDING' }
  ];

  // Construct standard JSON dossier schema
  const dossierData = {
    exportVersion: '1.0',
    generatedAt: new Date().toISOString(),
    syntheticDemo: true,
    disclaimer: 'SYNTHETIC DEMONSTRATION RECORD — NOT LEGAL ADVICE',
    record: {
      id: record.id,
      title: record.title,
      documentType: record.documentType || 'Not provided in record',
      jurisdiction: record.jurisdiction || 'Not provided in record',
      category: record.category || 'Not provided in record',
      riskLevel: record.riskLevel || 'Not provided in record',
      effectiveDate: record.effectiveDate || 'Not provided in record'
    },
    verification: {
      status: status,
      reviewerNotes: notes.trim() !== '' ? notes : 'NO REVIEWER OBSERVATIONS RECORDED',
      lastReviewedAt: stored.updatedAt || record.lastReviewedAt || null
    },
    clauses: clauses.map((c, i) => ({
      clauseIndex: i + 1,
      section: c.section,
      text: c.text
    })),
    reviewFlags: reviewFlags,
    reviewChecklist: reviewChecklist
  };

  // Trigger client-side Blob file download
  try {
    const jsonString = JSON.stringify(dossierData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${record.id}-review-dossier.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('[DossierExport] Failed to download JSON dossier:', err);
    return false;
  }
}

/**
 * Trigger print dialog for PDF saving via window.print()
 */
export function triggerPrintPDF() {
  window.print();
}
