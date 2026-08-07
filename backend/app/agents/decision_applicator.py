from typing import Any
from .contracts import AgentDecisionBundle


class AgentDecisionApplicator:
    """
    Applies validated AgentDecisionBundle actions to the simulation engine state.
    Strictly enforces:
    1. Bounded action parameters.
    2. Respects manual_policy_lock_ticks so user interventions override AI decisions.
    3. Separation of actions and emergent outcomes (does NOT set GDP/employment directly).
    """

    @staticmethod
    def apply_decisions(engine: Any, bundle: AgentDecisionBundle) -> None:
        gov = engine.government
        bank = getattr(engine, "bank", None)

        # 1. Manual Policy Lock Check (Constraint #2)
        policy_lock_ticks = getattr(engine, "manual_policy_lock_ticks", 0)
        if policy_lock_ticks > 0:
            engine.manual_policy_lock_ticks = policy_lock_ticks - 1
            # User policy locked -> skip autonomous tax/spending overrides
        else:
            # Apply Finance decision
            if bundle.finance:
                current_tax = float(getattr(gov, "tax_rate", 0.20))
                new_tax = max(0.05, min(0.60, current_tax + bundle.finance.tax_rate_delta))
                gov.tax_rate = round(new_tax, 4)

            # Apply Health decision
            if bundle.health:
                current_health_spend = float(getattr(gov, "healthcare_spending", 30000.0))
                new_health_spend = max(0.0, min(200000.0, current_health_spend + bundle.health.spending_delta))
                gov.healthcare_spending = round(new_health_spend, 2)

            # Apply Infrastructure decision
            if bundle.infrastructure:
                current_infra_spend = float(getattr(gov, "infrastructure_spending", 50000.0))
                new_infra_spend = max(0.0, min(200000.0, current_infra_spend + bundle.infrastructure.spending_delta))
                gov.infrastructure_spending = round(new_infra_spend, 2)

        # 2. Apply Central Bank Decision
        if bank and isinstance(bank, dict) and bundle.bank:
            current_rate = float(bank.get("interest_rate", 0.05))
            new_rate = max(0.01, min(0.25, current_rate + bundle.bank.interest_rate_delta))
            bank["interest_rate"] = round(new_rate, 4)

        # 3. Apply Business Game Moves (Store moves for single-count payoff evaluation during engine.step)
        if bundle.business_decisions:
            for b in engine.businesses:
                move_info = bundle.business_decisions.get(str(b.id))
                if move_info:
                    b.last_game_move = move_info.move

        # 4. Apply Citizen Compliance Behavior
        if bundle.citizen_behavior and hasattr(engine, "citizens"):
            target_compliance = max(0.40, min(0.98, bundle.citizen_behavior.compliance_rate))
            for c in engine.citizens:
                c.tax_compliance = round(target_compliance, 4)
