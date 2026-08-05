import random
import uuid
from typing import List, Tuple, Dict, Any, Optional
from uuid import UUID

from app.schemas.state import (
    CitizenState,
    BusinessState,
    GovernmentStateSchema,
    PolicyState,
    EventState,
    EconomicMetrics,
    TickSummary,
    TickResult,
)
from app.simulation.engine import SimulationEngine
from app.simulation.metrics import calculate_economic_metrics

OCCUPATIONS = [
    "Software Engineer", "Teacher", "Retail Worker", "Healthcare Worker",
    "Construction Worker", "Accountant", "Driver", "Factory Worker",
    "Designer", "Unemployed"
]

INDUSTRIES = [
    "Technology", "Retail", "Manufacturing", "Construction",
    "Healthcare", "Logistics", "Finance", "Food"
]

CITIZEN_GOALS = [
    "increase_savings", "find_job", "buy_home", "change_job",
    "reduce_expenses", "invest", "maintain_stability"
]

BUSINESS_GOALS = [
    "increase_profit", "hire_workers", "reduce_costs", "expand", "stabilize_cashflow"
]


def serialize_rng_state(rng: random.Random) -> Dict[str, Any]:
    """Serialize Python random state into a JSON-safe dictionary."""
    state_tuple = rng.getstate()
    # state_tuple is (version, (int, int, ... 625 ints), k)
    version, internal_state, k = state_tuple
    return {
        "version": version,
        "state": list(internal_state),
        "k": k
    }


def deserialize_rng_state(data: Dict[str, Any]) -> Tuple[int, Tuple[int, ...], Optional[float]]:
    """Deserialize a JSON-safe dictionary back into Python random state tuple."""
    version = int(data["version"])
    internal_state = tuple(int(x) for x in data["state"])
    k = data.get("k")
    return (version, internal_state, k)


class MockSimulationEngine(SimulationEngine):
    def __init__(self):
        self.simulation_id: Optional[UUID] = None
        self.seed: int = 42
        self.tick: int = 0
        self.rng: random.Random = random.Random(42)
        
        self.citizens: List[CitizenState] = []
        self.businesses: List[BusinessState] = []
        self.government: GovernmentStateSchema = GovernmentStateSchema(
            simulation_id=uuid.uuid4(),
            tax_rate=0.20,
            infrastructure_spending=50000.0,
            treasury=1000000.0,
            public_satisfaction=0.70,
        )
        self.active_events: List[EventState] = []
        self.current_metrics: Optional[EconomicMetrics] = None

    def initialize(
        self,
        simulation_id: UUID,
        seed: int,
        initial_policy: Optional[Dict[str, Any]] = None
    ) -> None:
        self.simulation_id = simulation_id
        self.seed = seed
        self.tick = 0
        self.rng = random.Random(seed)
        
        tax_rate = initial_policy.get("tax_rate", 0.20) if initial_policy else 0.20
        infra_spending = initial_policy.get("infrastructure_spending", 50000.0) if initial_policy else 50000.0

        self.government = GovernmentStateSchema(
            simulation_id=simulation_id,
            tax_rate=tax_rate,
            infrastructure_spending=infra_spending,
            treasury=1000000.0,
            public_satisfaction=0.70
        )
        self.active_events = []

        # Generate 12 Businesses
        self.businesses = []
        for i in range(12):
            industry = INDUSTRIES[i % len(INDUSTRIES)]
            name = f"{industry} Corp {i + 1}"
            base_revenue = round(self.rng.uniform(80000.0, 180000.0), 2)
            base_expenses = round(base_revenue * self.rng.uniform(0.65, 0.85), 2)
            profit = round(base_revenue - base_expenses, 2)
            
            business = BusinessState(
                id=uuid.uuid4(),
                simulation_id=simulation_id,
                name=name,
                industry=industry,
                employee_count=0,
                revenue=base_revenue,
                expenses=base_expenses,
                profit=profit,
                health=round(self.rng.uniform(0.75, 0.95), 2),
                current_goal=self.rng.choice(BUSINESS_GOALS),
                recent_decisions=[{
                    "tick": 0,
                    "action": "initialized",
                    "reason": "Business established during city initialization"
                }]
            )
            self.businesses.append(business)

        # Generate 100 Citizens
        self.citizens = []
        for i in range(100):
            occ = self.rng.choice(OCCUPATIONS)
            is_employed = occ != "Unemployed"
            assigned_biz = self.rng.choice(self.businesses) if is_employed else None
            
            if is_employed and assigned_biz:
                assigned_biz.employee_count += 1
                base_income = round(self.rng.uniform(40000.0, 120000.0), 2)
                employer_id = assigned_biz.id
            else:
                base_income = 0.0
                employer_id = None
                occ = "Unemployed"
                is_employed = False

            wealth = round(self.rng.uniform(2000.0, 75000.0), 2) if is_employed else round(self.rng.uniform(200.0, 5000.0), 2)
            
            citizen = CitizenState(
                id=uuid.uuid4(),
                simulation_id=simulation_id,
                name=f"Citizen_{i + 1}",
                age=self.rng.randint(20, 65),
                occupation=occ,
                income=base_income,
                wealth=wealth,
                employed=is_employed,
                employer_id=employer_id,
                satisfaction=round(self.rng.uniform(0.60, 0.90), 2) if is_employed else round(self.rng.uniform(0.30, 0.55), 2),
                current_goal=self.rng.choice(CITIZEN_GOALS),
                recent_decisions=[{
                    "tick": 0,
                    "action": "initialized",
                    "reason": "Citizen registered in initial city census"
                }]
            )
            self.citizens.append(citizen)

        self.current_metrics = calculate_economic_metrics(self.citizens, self.businesses, self.government)

    def step(self) -> TickResult:
        self.tick += 1
        
        # 1. Process active events
        event_impact = {"revenue_mult": 1.0, "hiring_mult": 1.0, "satisfaction_mult": 1.0}
        remaining_events = []
        for ev in self.active_events:
            sev = ev.severity
            if ev.event_type == "recession":
                event_impact["revenue_mult"] *= (1.0 - 0.25 * sev)
                event_impact["hiring_mult"] *= (1.0 - 0.40 * sev)
            elif ev.event_type == "boom":
                event_impact["revenue_mult"] *= (1.0 + 0.30 * sev)
                event_impact["hiring_mult"] *= (1.0 + 0.35 * sev)
            elif ev.event_type == "flood":
                event_impact["revenue_mult"] *= (1.0 - 0.20 * sev)
                event_impact["satisfaction_mult"] *= (1.0 - 0.30 * sev)
            elif ev.event_type == "factory_closure":
                event_impact["hiring_mult"] *= (1.0 - 0.50 * sev)
            elif ev.event_type == "investment_stimulus":
                event_impact["revenue_mult"] *= (1.0 + 0.20 * sev)

            ev.duration_remaining -= 1
            if ev.duration_remaining > 0:
                remaining_events.append(ev)
        self.active_events = remaining_events

        # 2. Infrastructure spending boost
        infra_boost = 1.0 + min(0.15, (self.government.infrastructure_spending / 500000.0))

        # 3. Update Businesses
        for biz in self.businesses:
            noise = self.rng.uniform(0.95, 1.05)
            biz.revenue = round(biz.revenue * noise * event_impact["revenue_mult"] * infra_boost, 2)
            biz.expenses = round(biz.expenses * self.rng.uniform(0.97, 1.03), 2)
            biz.profit = round(biz.revenue - biz.expenses, 2)
            
            # Update Business Health
            if biz.profit > 0:
                biz.health = min(1.0, round(biz.health + 0.02, 4))
            else:
                biz.health = max(0.0, round(biz.health - 0.04, 4))

            # Small hiring/firing decision
            decision_action = "maintained_workforce"
            decision_reason = "Stable economic output"
            if biz.health > 0.85 and self.rng.random() < (0.3 * event_impact["hiring_mult"]):
                biz.employee_count += 1
                decision_action = "expanded_workforce"
                decision_reason = "High business health and revenue profit"
            elif biz.health < 0.40 and biz.employee_count > 1 and self.rng.random() < 0.3:
                biz.employee_count -= 1
                decision_action = "reduced_workforce"
                decision_reason = "Low profitability and economic downturn"

            # Record decision (bounded to 10)
            biz.recent_decisions.append({
                "tick": self.tick,
                "action": decision_action,
                "reason": decision_reason
            })
            if len(biz.recent_decisions) > 10:
                biz.recent_decisions = biz.recent_decisions[-10:]

        # 4. Update Citizens (Income, Spending, Taxes)
        total_tax_collected = 0.0
        tax_rate = self.government.tax_rate

        for cit in self.citizens:
            if cit.employed and cit.income > 0:
                gross_income = cit.income / 12.0  # Monthly tick baseline
                tax_paid = gross_income * tax_rate
                disposable_income = gross_income - tax_paid
                total_tax_collected += tax_paid
                
                # Spending behavior
                spending = disposable_income * self.rng.uniform(0.70, 0.90)
                savings = disposable_income - spending
                cit.wealth = max(0.0, round(cit.wealth + savings, 2))
                cit.satisfaction = min(1.0, round(cit.satisfaction + 0.01 * event_impact["satisfaction_mult"], 4))
                action = "saved_income"
                reason = "Received salary payout"
            else:
                # Unemployed citizen spending from wealth
                spending = min(cit.wealth, 500.0)
                cit.wealth = max(0.0, round(cit.wealth - spending, 2))
                cit.satisfaction = max(0.0, round(cit.satisfaction - 0.02 * event_impact["satisfaction_mult"], 4))
                action = "drew_savings"
                reason = "Covered basic expenses while seeking employment"

            cit.recent_decisions.append({
                "tick": self.tick,
                "action": action,
                "reason": reason
            })
            if len(cit.recent_decisions) > 10:
                cit.recent_decisions = cit.recent_decisions[-10:]

        # 5. Update Government Treasury & Satisfaction
        self.government.treasury = round(
            self.government.treasury + total_tax_collected - self.government.infrastructure_spending, 2
        )
        self.government.public_satisfaction = max(
            0.0, min(1.0, round(self.government.public_satisfaction + (0.01 if total_tax_collected > self.government.infrastructure_spending else -0.01), 4))
        )

        # 6. Recalculate metrics
        self.current_metrics = calculate_economic_metrics(self.citizens, self.businesses, self.government)

        # 7. Formulate TickResult
        total_citizens = len(self.citizens)
        employed_citizens = sum(1 for c in self.citizens if c.employed)
        
        return TickResult(
            simulation_id=self.simulation_id,
            tick=self.tick,
            metrics=self.current_metrics,
            policy=PolicyState(
                tax_rate=self.government.tax_rate,
                infrastructure_spending=self.government.infrastructure_spending
            ),
            active_events=self.active_events,
            summary=TickSummary(
                employed_citizens=employed_citizens,
                total_citizens=total_citizens,
                business_count=len(self.businesses)
            )
        )

    def get_state(self) -> Dict[str, Any]:
        return {
            "simulation_id": str(self.simulation_id),
            "seed": self.seed,
            "tick": self.tick,
            "government": self.government.model_dump(mode="json"),
            "citizens": [c.model_dump(mode="json") for c in self.citizens],
            "businesses": [b.model_dump(mode="json") for b in self.businesses],
            "active_events": [e.model_dump(mode="json") for e in self.active_events],
            "metrics": self.current_metrics.model_dump(mode="json") if self.current_metrics else None,
            "rng_state": serialize_rng_state(self.rng)
        }

    def get_metrics(self) -> EconomicMetrics:
        if not self.current_metrics:
            self.current_metrics = calculate_economic_metrics(self.citizens, self.businesses, self.government)
        return self.current_metrics

    def get_agents(self) -> Tuple[List[CitizenState], List[BusinessState]]:
        return self.citizens, self.businesses

    def get_government(self) -> GovernmentStateSchema:
        return self.government

    def update_policy(self, policy_data: Dict[str, Any]) -> PolicyState:
        if "tax_rate" in policy_data and policy_data["tax_rate"] is not None:
            self.government.tax_rate = float(policy_data["tax_rate"])
        if "infrastructure_spending" in policy_data and policy_data["infrastructure_spending"] is not None:
            self.government.infrastructure_spending = float(policy_data["infrastructure_spending"])
        return PolicyState(
            tax_rate=self.government.tax_rate,
            infrastructure_spending=self.government.infrastructure_spending
        )

    def inject_event(
        self,
        event_type: str,
        severity: float,
        metadata: Optional[Dict[str, Any]] = None
    ) -> EventState:
        event = EventState(
            id=uuid.uuid4(),
            simulation_id=self.simulation_id,
            tick=self.tick,
            event_type=event_type,
            severity=severity,
            metadata=metadata or {},
            duration_remaining=3
        )
        self.active_events.append(event)
        return event

    def get_world_summary(self) -> Dict[str, Any]:
        """
        Generate lightweight world summary for real-time WebSocket tick messages.
        Uses stable business UUIDs and deterministic citizen group IDs.
        """
        # 1. Compact Businesses with Stable UUIDs
        biz_summary = [
            {
                "id": str(b.id),
                "name": b.name,
                "industry": b.industry,
                "health": b.health,
                "revenue": b.revenue,
                "profit": b.profit,
                "employee_count": b.employee_count
            }
            for b in self.businesses
        ]

        # 2. Aggregated Citizen Groups by Occupation with Deterministic IDs
        groups_dict: Dict[str, Dict[str, Any]] = {}
        for c in self.citizens:
            slug = c.occupation.lower().replace(" ", "_")
            group_id = f"group:occupation:{slug}"
            if group_id not in groups_dict:
                groups_dict[group_id] = {
                    "id": group_id,
                    "occupation": c.occupation,
                    "count": 0,
                    "employed_count": 0,
                    "total_income": 0.0,
                    "total_wealth": 0.0,
                    "total_satisfaction": 0.0
                }
            g = groups_dict[group_id]
            g["count"] += 1
            if c.employed:
                g["employed_count"] += 1
            g["total_income"] += c.income
            g["total_wealth"] += c.wealth
            g["total_satisfaction"] += c.satisfaction

        citizen_groups = []
        for g in groups_dict.values():
            cnt = g["count"]
            citizen_groups.append({
                "id": g["id"],
                "occupation": g["occupation"],
                "count": cnt,
                "employed_count": g["employed_count"],
                "average_income": round(g["total_income"] / cnt, 2) if cnt > 0 else 0.0,
                "average_wealth": round(g["total_wealth"] / cnt, 2) if cnt > 0 else 0.0,
                "average_satisfaction": round(g["total_satisfaction"] / cnt, 4) if cnt > 0 else 0.0,
            })

        return {
            "businesses": biz_summary,
            "citizen_groups": citizen_groups,
            "government": {
                "id": "government",
                "tax_rate": self.government.tax_rate,
                "infrastructure_spending": self.government.infrastructure_spending,
                "treasury": self.government.treasury,
                "public_satisfaction": self.government.public_satisfaction
            }
        }

    def get_full_world_state(self) -> Dict[str, Any]:
        """
        Generate detailed world state for GET /api/simulations/{id}/world.
        Includes stable node IDs, citizen group aggregates, truthful flows,
        and lightweight graph relationships prepared for Phase 4B interactive visualization.
        """
        world_summary = self.get_world_summary()

        # Truthful flow metrics calculated from current tick state
        employed_citizens = [c for c in self.citizens if c.employed]
        salary_total = round(sum(c.income / 12.0 for c in employed_citizens), 2)
        tax_total = round(salary_total * self.government.tax_rate, 2)
        consumer_spending_total = round(sum(
            ((c.income / 12.0 - (c.income / 12.0 * self.government.tax_rate)) * 0.8) if c.employed else min(c.wealth, 500.0)
            for c in self.citizens
        ), 2)

        # Derive lightweight Phase 4B graph relationships
        relationships = []
        
        # 1. Government -> Business infrastructure links
        for b in self.businesses:
            relationships.append({
                "id": f"rel:gov:biz:{b.id}",
                "source": "government",
                "target": str(b.id),
                "type": "infrastructure"
            })

        # 2. Business -> Citizen Group employment links
        biz_emp_groups: Dict[Tuple[str, str], int] = {}
        for c in self.citizens:
            if c.employed and c.employer_id:
                slug = c.occupation.lower().replace(" ", "_")
                group_id = f"group:occupation:{slug}"
                key = (str(c.employer_id), group_id)
                biz_emp_groups[key] = biz_emp_groups.get(key, 0) + 1

        for (biz_id, group_id), count in biz_emp_groups.items():
            relationships.append({
                "id": f"rel:biz:{biz_id}:group:{group_id}",
                "source": biz_id,
                "target": group_id,
                "type": "employment",
                "employee_count": count
            })

        return {
            "simulation_id": str(self.simulation_id),
            "tick": self.tick,
            "government": world_summary["government"],
            "businesses": world_summary["businesses"],
            "citizen_groups": world_summary["citizen_groups"],
            "relationships": relationships,
            "flows": {
                "salary_total": salary_total,
                "consumer_spending_total": consumer_spending_total,
                "tax_total": tax_total,
                "infrastructure_spending": self.government.infrastructure_spending
            },
            "metrics": self.get_metrics().model_dump(mode="json")
        }

    def export_state(self) -> Dict[str, Any]:
        """Export full engine state into a JSON-serializable dictionary."""
        return self.get_state()


    def import_state(self, state_dict: Dict[str, Any]) -> None:
        """Import engine state from a JSON-serializable dictionary."""
        self.simulation_id = UUID(state_dict["simulation_id"])
        self.seed = state_dict["seed"]
        self.tick = state_dict["tick"]
        
        self.government = GovernmentStateSchema.model_validate(state_dict["government"])
        self.citizens = [CitizenState.model_validate(c) for c in state_dict["citizens"]]
        self.businesses = [BusinessState.model_validate(b) for b in state_dict["businesses"]]
        self.active_events = [EventState.model_validate(e) for e in state_dict.get("active_events", [])]
        
        if state_dict.get("metrics"):
            self.current_metrics = EconomicMetrics.model_validate(state_dict["metrics"])
        else:
            self.current_metrics = calculate_economic_metrics(self.citizens, self.businesses, self.government)
            
        if "rng_state" in state_dict and state_dict["rng_state"]:
            raw_rng = deserialize_rng_state(state_dict["rng_state"])
            self.rng = random.Random(self.seed)
            self.rng.setstate(raw_rng)
