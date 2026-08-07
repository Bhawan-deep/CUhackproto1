import { apiRequest } from './client';

/**
 * Create a parallel experiment by forking baseline & variant branches.
 */
export async function createExperiment(sourceSimId, payload) {
  return apiRequest(`/api/experiments/simulations/${sourceSimId}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Execute parallel experiment for N horizon ticks and compute deltas.
 */
export async function runExperiment(experimentId, payload) {
  return apiRequest(`/api/experiments/${experimentId}/run`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Retrieve experiment comparison results.
 */
export async function getExperimentComparison(experimentId) {
  return apiRequest(`/api/experiments/${experimentId}`);
}

/**
 * Retrieve synchronized historical world snapshots for both Universe A and B at relative tick.
 */
export async function getExperimentSnapshot(experimentId, relativeTick) {
  return apiRequest(`/api/experiments/${experimentId}/snapshots/${relativeTick}`);
}
