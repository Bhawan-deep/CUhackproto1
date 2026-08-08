import { SAMPLE_LEGAL_RECORDS } from '../data/legalRecords';

const STORAGE_KEY = 'bounty_legal_records_v1';

/**
 * Load all stored review states from localStorage
 * Returns an object mapping recordId -> { status, reviewerNotes, updatedAt }
 */
export function getStoredReviews() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[BountyStorage] Failed to read reviews from localStorage:', err);
    return {};
  }
}

/**
 * Save review state for a single record
 */
export function saveRecordReview(recordId, status, reviewerNotes) {
  try {
    const current = getStoredReviews();
    current[recordId] = {
      status,
      reviewerNotes: reviewerNotes || '',
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    return true;
  } catch (err) {
    console.error('[BountyStorage] Failed to save review to localStorage:', err);
    return false;
  }
}

/**
 * Get merged legal records (Sample dataset + stored localStorage reviews)
 */
export function getMergedLegalRecords() {
  const reviews = getStoredReviews();
  return SAMPLE_LEGAL_RECORDS.map((rec) => {
    const stored = reviews[rec.id];
    return {
      ...rec,
      verificationStatus: stored?.status || rec.defaultStatus,
      reviewerNotes: stored?.reviewerNotes !== undefined ? stored.reviewerNotes : rec.defaultNotes,
      lastReviewedAt: stored?.updatedAt || null
    };
  });
}
