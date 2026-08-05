import { IMPACT_THRESHOLDS } from './impactThresholds';

/**
 * Capture an intervention baseline snapshot immediately BEFORE sending an intervention request.
 */
export function createBaselineSnapshot(tick, metrics, worldData, interventionInfo) {
  if (!worldData) return null;

  const bizMap = {};
  (worldData.businesses || []).forEach(b => {
    bizMap[String(b.id)] = { ...b };
  });

  const groupMap = {};
  (worldData.citizen_groups || []).forEach(g => {
    groupMap[String(g.id)] = { ...g };
  });

  return {
    interventionInfo, // { type: 'policy' | 'shock', name: string, detail: string, appliedTick: number }
    appliedTick: tick,
    metrics: metrics ? { ...metrics } : null,
    government: worldData.government ? { ...worldData.government } : null,
    businesses: bizMap,
    citizenGroups: groupMap,
  };
}

/**
 * Compute deltas between baseline (pre-intervention) and current state,
 * as well as deltas between previous tick and current state.
 */
export function computeImpactDeltas(currentMetrics, currentWorldData, baseline, previousTickWorldData) {
  if (!baseline || !currentWorldData) return null;

  // 1. Macro Metrics Deltas
  const macroDeltas = {};
  if (baseline.metrics && currentMetrics) {
    macroDeltas.employment = {
      before: baseline.metrics.employment_rate,
      current: currentMetrics.employment_rate,
      delta: currentMetrics.employment_rate - baseline.metrics.employment_rate
    };
    macroDeltas.output = {
      before: baseline.metrics.economic_output,
      current: currentMetrics.economic_output,
      delta: currentMetrics.economic_output - baseline.metrics.economic_output,
      pctDelta: baseline.metrics.economic_output > 0 
        ? ((currentMetrics.economic_output - baseline.metrics.economic_output) / baseline.metrics.economic_output) * 100 
        : 0
    };
    macroDeltas.inequality = {
      before: baseline.metrics.inequality,
      current: currentMetrics.inequality,
      delta: currentMetrics.inequality - baseline.metrics.inequality
    };
    macroDeltas.satisfaction = {
      before: baseline.metrics.public_satisfaction,
      current: currentMetrics.public_satisfaction,
      delta: currentMetrics.public_satisfaction - baseline.metrics.public_satisfaction
    };
    macroDeltas.businessHealth = {
      before: baseline.metrics.business_health,
      current: currentMetrics.business_health,
      delta: currentMetrics.business_health - baseline.metrics.business_health
    };
  }

  // 2. Business Deltas & Normalized Scoring for Most Affected
  const businessDeltas = {};
  const affectedBizList = [];

  (currentWorldData.businesses || []).forEach(b => {
    const bId = String(b.id);
    const baseB = baseline.businesses[bId];
    if (!baseB) return;

    const healthDelta = b.health - baseB.health;
    const empDelta = b.employee_count - baseB.employee_count;
    const revDelta = b.revenue - baseB.revenue;

    const isAffected = Math.abs(healthDelta) >= IMPACT_THRESHOLDS.BUSINESS_HEALTH || Math.abs(empDelta) >= IMPACT_THRESHOLDS.EMPLOYED_COUNT;

    businessDeltas[bId] = {
      id: bId,
      name: b.name,
      industry: b.industry,
      health: { before: baseB.health, current: b.health, delta: healthDelta },
      employeeCount: { before: baseB.employee_count, current: b.employee_count, delta: empDelta },
      revenue: { before: baseB.revenue, current: b.revenue, delta: revDelta },
      isAffected
    };

    if (isAffected) {
      // Normalized scoring: health change + relative employee change
      const baseEmp = Math.max(baseB.employee_count, 1);
      const score = Math.abs(healthDelta) + Math.abs(empDelta) / baseEmp;
      affectedBizList.push({ ...businessDeltas[bId], score });
    }
  });

  affectedBizList.sort((a, b) => b.score - a.score);

  // 3. Citizen Group Deltas & Normalized Scoring
  const groupDeltas = {};
  const affectedGroupList = [];

  (currentWorldData.citizen_groups || []).forEach(g => {
    const gId = String(g.id);
    const baseG = baseline.citizenGroups[gId];
    if (!baseG) return;

    const empDelta = g.employed_count - baseG.employed_count;
    const satDelta = g.average_satisfaction - baseG.average_satisfaction;
    const incDelta = g.average_income - baseG.average_income;

    const isAffected = Math.abs(satDelta) >= IMPACT_THRESHOLDS.CITIZEN_SATISFACTION || Math.abs(empDelta) >= IMPACT_THRESHOLDS.EMPLOYED_COUNT;

    groupDeltas[gId] = {
      id: gId,
      occupation: g.occupation,
      count: g.count,
      employedCount: { before: baseG.employed_count, current: g.employed_count, delta: empDelta },
      satisfaction: { before: baseG.average_satisfaction, current: g.average_satisfaction, delta: satDelta },
      income: { before: baseG.average_income, current: g.average_income, delta: incDelta },
      isAffected
    };

    if (isAffected) {
      const baseCount = Math.max(baseG.count, 1);
      const score = Math.abs(satDelta) + Math.abs(empDelta) / baseCount;
      affectedGroupList.push({ ...groupDeltas[gId], score });
    }
  });

  affectedGroupList.sort((a, b) => b.score - a.score);

  return {
    macroDeltas,
    businessDeltas,
    groupDeltas,
    mostAffectedBusinesses: affectedBizList.slice(0, 3),
    mostAffectedGroups: affectedGroupList.slice(0, 3),
  };
}
