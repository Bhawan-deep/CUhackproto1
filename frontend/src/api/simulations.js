import { apiRequest } from './client';

/**
 * Check backend service health status.
 */
export async function getHealthStatus() {
  return apiRequest('/api/health');
}

/**
 * Create a new simulation.
 * @param {Object} data - { name: string, random_seed: number }
 */
export async function createSimulation(data = { name: "Demo Economy", random_seed: 42 }) {
  return apiRequest('/api/simulations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Retrieve all simulations list.
 */
export async function getSimulations() {
  return apiRequest('/api/simulations');
}

/**
 * Retrieve a specific simulation by UUID.
 * @param {string} id - Simulation UUID
 */
export async function getSimulation(id) {
  return apiRequest(`/api/simulations/${id}`);
}

/**
 * Retrieve detailed world state formatted for Phase 4B interactive visualization.
 * @param {string} id - Simulation UUID
 */
export async function getWorldState(id) {
  return apiRequest(`/api/simulations/${id}/world`);
}

/**
 * Start automatic background simulation runner.
 */
export async function startSimulation(id) {
  return apiRequest(`/api/simulations/${id}/start`, { method: 'POST' });
}

/**
 * Pause automatic background simulation runner.
 */
export async function pauseSimulation(id) {
  return apiRequest(`/api/simulations/${id}/pause`, { method: 'POST' });
}

/**
 * Resume automatic background simulation runner.
 */
export async function resumeSimulation(id) {
  return apiRequest(`/api/simulations/${id}/resume`, { method: 'POST' });
}

/**
 * Manually advance simulation by exactly 1 tick.
 */
export async function stepSimulation(id) {
  return apiRequest(`/api/simulations/${id}/step`, { method: 'POST' });
}

/**
 * Reset simulation back to initial Tick 0 state.
 */
export async function resetSimulation(id) {
  return apiRequest(`/api/simulations/${id}/reset`, { method: 'POST' });
}

/**
 * Update government policy parameters (tax_rate, infrastructure_spending).
 */
export async function updatePolicy(id, policyData) {
  return apiRequest(`/api/simulations/${id}/policy`, {
    method: 'PUT',
    body: JSON.stringify(policyData),
  });
}

/**
 * Inject an economic shock or stimulus event.
 */
export async function injectEvent(id, eventData) {
  return apiRequest(`/api/simulations/${id}/events`, {
    method: 'POST',
    body: JSON.stringify(eventData),
  });
}

/**
 * Retrieve persisted event history.
 */
export async function getEventHistory(id) {
  return apiRequest(`/api/simulations/${id}/history/events`);
}

/**
 * Retrieve persisted policy history.
 */
export async function getPolicyHistory(id) {
  return apiRequest(`/api/simulations/${id}/history/policies`);
}

/**
 * Retrieve runtime runner status.
 */
export async function getRuntimeStatus(id) {
  return apiRequest(`/api/simulations/${id}/runtime`);
}

/**
 * Retrieve current economic metrics.
 */
export async function getSimulationMetrics(id) {
  return apiRequest(`/api/simulations/${id}/metrics`);
}
