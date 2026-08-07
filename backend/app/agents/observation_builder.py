from typing import Any
from .contracts import (
    AgentObservation,
    GovernmentObservation,
    BankObservation,
    BusinessObservation,
    CitizensSummaryObservation,
    MacroMetricsObservation,
)


class ObservationBuilder:
    """
    Adapter class converting authoritative MockSimulationEngine internal state
    into the ML-ready AgentObservation contract schema.
    """

    @staticmethod
    def build_observation(engine: Any, simulation_id: str, tick: int) -> AgentObservation:
        metrics = engine.get_metrics()
        gov = engine.government
        bank_state = getattr(engine, "bank", None)

        # Government Observation
        gov_obs = GovernmentObservation(
            treasury=float(getattr(gov, "treasury", 100000.0)),
            tax_rate=float(getattr(gov, "tax_rate", 0.20)),
            infrastructure_spending=float(getattr(gov, "infrastructure_spending", 50000.0)),
            healthcare_spending=float(getattr(gov, "healthcare_spending", 30000.0)),
            public_satisfaction=float(getattr(metrics, "public_satisfaction", 0.75)),
            unemployment_rate=1.0 - float(getattr(metrics, "employment_rate", 0.95)),
            inflation_rate=float(getattr(gov, "inflation_rate", 0.02)),
            recent_events=[e.event_type for e in getattr(engine, "active_events", [])],
        )

        # Bank Observation
        if bank_state and isinstance(bank_state, dict):
            bank_obs = BankObservation(
                interest_rate=float(bank_state.get("interest_rate", 0.05)),
                reserves=float(bank_state.get("reserves", 1000000.0)),
                default_rate=float(bank_state.get("default_rate", 0.02)),
                active_loans=int(bank_state.get("approved_loans", 0)),
                pending_loan_requests=int(bank_state.get("rejected_loans", 0)),
            )
        else:
            bank_obs = BankObservation(
                interest_rate=0.05,
                reserves=1000000.0,
                default_rate=0.02,
                active_loans=0,
                pending_loan_requests=0,
            )

        # Businesses Observation
        bus_obs_list = []
        for b in engine.businesses:
            bus_obs_list.append(
                BusinessObservation(
                    id=str(b.id),
                    name=str(b.name),
                    industry=str(b.industry),
                    capital=float(getattr(b, "capital", 50000.0)),
                    revenue=float(b.revenue),
                    profit=float(b.profit),
                    employee_count=int(b.employee_count),
                    health=float(b.health),
                    personality=str(getattr(b, "personality", "NEUTRAL")),
                    rival_id=str(getattr(b, "rival_business_id", "")) if getattr(b, "rival_business_id", None) else None,
                    last_rival_move=str(getattr(b, "last_game_move", "COOPERATE")) if getattr(b, "last_game_move", None) else "COOPERATE",
                )
            )

        # Citizens Summary Observation
        citizens = engine.citizens
        total_cit = len(citizens) if citizens else 1
        employed = sum(1 for c in citizens if getattr(c, "employed", False))
        unemployed_rate = (total_cit - employed) / float(total_cit) if total_cit > 0 else 0.0
        avg_wealth = sum(getattr(c, "wealth", 0.0) for c in citizens) / float(total_cit) if total_cit > 0 else 0.0
        avg_satisfaction = sum(getattr(c, "satisfaction", 0.75) for c in citizens) / float(total_cit) if total_cit > 0 else 0.75
        avg_trust = sum(getattr(c, "trust", 0.70) for c in citizens) / float(total_cit) if total_cit > 0 else 0.70
        avg_compliance = sum(getattr(c, "tax_compliance", 0.85) for c in citizens) / float(total_cit) if total_cit > 0 else 0.85

        cit_summary = CitizensSummaryObservation(
            population=total_cit,
            employed_count=employed,
            unemployment_rate=round(unemployed_rate, 4),
            average_income=3500.0,
            average_wealth=round(avg_wealth, 2),
            average_satisfaction=round(avg_satisfaction, 4),
            average_trust=round(avg_trust, 4),
            tax_compliance_rate=round(avg_compliance, 4),
            enforcement_strength=0.80,
            average_tax_burden=float(getattr(gov, "tax_rate", 0.20)),
        )

        # Macro Metrics Observation
        macro_obs = MacroMetricsObservation(
            economic_output=float(getattr(metrics, "economic_output", 0.0)),
            inequality_gini=float(getattr(metrics, "inequality", 0.30)),
            business_health=float(getattr(metrics, "business_health", 0.90)),
        )

        return AgentObservation(
            simulation_id=str(simulation_id),
            tick=int(tick),
            government=gov_obs,
            bank=bank_obs,
            businesses=bus_obs_list,
            citizens_summary=cit_summary,
            macro_metrics=macro_obs,
        )
