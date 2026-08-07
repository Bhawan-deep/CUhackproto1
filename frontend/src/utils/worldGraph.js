/**
 * Utility to transform GET /api/simulations/{id}/world response data
 * into clean React Flow nodes and edges with deterministic spatial layout.
 */

export function transformWorldToGraph(worldData) {
  if (!worldData) return { initialNodes: [], initialEdges: [] };

  const nodes = [];
  const edges = [];

  // 1. Government Node (Top Left)
  if (worldData.government) {
    nodes.push({
      id: "government",
      type: "government",
      position: { x: 380, y: 30 },
      data: {
        id: "government",
        tax_rate: worldData.government.tax_rate,
        infrastructure_spending: worldData.government.infrastructure_spending,
        healthcare_spending: worldData.government.healthcare_spending,
        treasury: worldData.government.treasury,
        public_satisfaction: worldData.government.public_satisfaction,
        inflation_rate: worldData.government.inflation_rate,
      },
    });
  }

  // 2. Central Bank Node (Top Right)
  if (worldData.bank || worldData.government) {
    nodes.push({
      id: "bank",
      type: "bank",
      position: { x: 740, y: 30 },
      data: {
        id: "bank",
        bank: worldData.bank || { interest_rate: 0.05, reserves: 1000000, default_rate: 0.02 },
      },
    });
  }

  // 3. Business Nodes (12 Nodes in 2 Structured Rows)
  const businesses = worldData.businesses || [];
  businesses.forEach((biz, index) => {
    const row = Math.floor(index / 6); // 2 rows of 6
    const col = index % 6;
    const x = 80 + col * 190;
    const y = 220 + row * 145;

    nodes.push({
      id: String(biz.id),
      type: "business",
      position: { x, y },
      data: {
        id: String(biz.id),
        name: biz.name,
        industry: biz.industry,
        health: biz.health,
        capital: biz.capital,
        personality: biz.personality,
        last_game_move: biz.last_game_move,
        rival_id: biz.rival_id,
        revenue: biz.revenue,
        profit: biz.profit,
        employee_count: biz.employee_count,
      },
    });
  });

  // 4. Citizen Occupation Group Nodes (10 Nodes in 2 Structured Rows)
  const groups = worldData.citizen_groups || [];
  groups.forEach((group, index) => {
    const row = Math.floor(index / 5); // 2 rows of 5
    const col = index % 5;
    const x = 120 + col * 220;
    const y = 540 + row * 130;

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
        average_trust: group.average_trust,
        average_tax_compliance: group.average_tax_compliance,
      },
    });
  });

  // 5. Edges with Money Flow Visualizations
  const relationships = worldData.relationships || [];
  relationships.forEach((rel) => {
    const isGov = rel.type === "infrastructure";
    const isRival = rel.type === "rivalry";
    
    let flowType = "salary";
    if (isGov) flowType = "infra";
    else if (isRival) flowType = rel.move === "DEFECT" ? "consumption" : "loan";

    edges.push({
      id: String(rel.id),
      source: String(rel.source),
      target: String(rel.target),
      type: "moneyFlow",
      data: {
        flowType: flowType,
        type: rel.type,
        move: rel.move,
        employee_count: rel.employee_count,
      },
    });
  });

  // Edge connecting Government & Central Bank
  edges.push({
    id: "rel:gov:bank",
    source: "government",
    target: "bank",
    type: "moneyFlow",
    data: { flowType: "loan", type: "monetary_policy" }
  });

  return { initialNodes: nodes, initialEdges: edges };
}


