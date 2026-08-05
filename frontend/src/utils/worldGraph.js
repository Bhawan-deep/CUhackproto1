/**
 * Utility to transform GET /api/simulations/{id}/world response data
 * into clean React Flow nodes and edges with deterministic spatial layout.
 */

export function transformWorldToGraph(worldData) {
  if (!worldData) return { initialNodes: [], initialEdges: [] };

  const nodes = [];
  const edges = [];

  // 1. Government Node (Top Center)
  if (worldData.government) {
    nodes.push({
      id: "government",
      type: "government",
      position: { x: 550, y: 30 },
      data: {
        id: "government",
        tax_rate: worldData.government.tax_rate,
        infrastructure_spending: worldData.government.infrastructure_spending,
        treasury: worldData.government.treasury,
        public_satisfaction: worldData.government.public_satisfaction,
      },
    });
  }

  // 2. Business Nodes (12 Nodes in 2 Structured Rows)
  const businesses = worldData.businesses || [];
  businesses.forEach((biz, index) => {
    const row = Math.floor(index / 6); // 2 rows of 6
    const col = index % 6;
    const x = 80 + col * 190;
    const y = 200 + row * 140;

    nodes.push({
      id: String(biz.id),
      type: "business",
      position: { x, y },
      data: {
        id: String(biz.id),
        name: biz.name,
        industry: biz.industry,
        health: biz.health,
        revenue: biz.revenue,
        profit: biz.profit,
        employee_count: biz.employee_count,
      },
    });
  });

  // 3. Citizen Occupation Group Nodes (10 Nodes in 2 Structured Rows)
  const groups = worldData.citizen_groups || [];
  groups.forEach((group, index) => {
    const row = Math.floor(index / 5); // 2 rows of 5
    const col = index % 5;
    const x = 120 + col * 220;
    const y = 520 + row * 130;

    nodes.push({
      id: String(group.id),
      type: "citizenGroup",
      position: { x, y },
      data: {
        id: String(group.id),
        occupation: group.occupation,
        count: group.count,
        employed_count: group.employed_count,
        average_income: group.average_income,
        average_wealth: group.average_wealth,
        average_satisfaction: group.average_satisfaction,
      },
    });
  });

  // 4. Edges (ONLY backend-derived relationships returned by /world)
  const relationships = worldData.relationships || [];
  relationships.forEach((rel) => {
    const isGov = rel.type === "infrastructure";
    edges.push({
      id: String(rel.id),
      source: String(rel.source),
      target: String(rel.target),
      type: "default",
      animated: isGov,
      style: {
        stroke: isGov ? "#38bdf8" : "#475569",
        strokeWidth: isGov ? 1.5 : 1.2,
        opacity: isGov ? 0.35 : 0.25,
      },
      data: {
        type: rel.type,
        employee_count: rel.employee_count,
      },
    });
  });

  return { initialNodes: nodes, initialEdges: edges };
}
