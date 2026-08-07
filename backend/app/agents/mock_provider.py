import math
from typing import Dict
from .contracts import (
    AgentObservation,
    AgentDecisionBundle,
    FinanceDecision,
    HealthDecision,
    InfrastructureDecision,
    BankDecision,
    BusinessMove,
    CitizenBehavior,
    StrategicState,
    SpendingAllocation,
)


class MockAgentDecisionProvider:
    """
    Deterministic Agent Decision Provider implementing realistic economic heuristics.
    Given identical AgentObservation input, produces 100% identical decision outputs.
    """

    def decide_sync(self, observation: AgentObservation) -> AgentDecisionBundle:
        gov = observation.government
        bank = observation.bank
        cit = observation.citizens_summary
        macro = observation.macro_metrics

        # 1. Finance Agent Decision
        tax_delta = 0.0
        finance_reasoning = "Fiscal policy stable."
        if gov.unemployment_rate > 0.08:
            tax_delta = -0.01
            finance_reasoning = "Unemployment elevated (>8%); applying modest tax relief."
        elif gov.treasury < 50000.0:
            tax_delta = 0.01
            finance_reasoning = "Treasury reserves low (<$50k); increasing tax rate slightly."
        elif gov.inflation_rate > 0.04:
            tax_delta = 0.01
            finance_reasoning = "Inflation high (>4%); tightening fiscal policy."

        finance_dec = FinanceDecision(
            tax_rate_delta=tax_delta,
            spending_allocation=SpendingAllocation(healthcare=0.35, infrastructure=0.40, reserve=0.25),
            reasoning_summary=finance_reasoning,
        )

        # 2. Health Agent Decision
        health_delta = 0.0
        health_reasoning = "Healthcare spending aligned with public health targets."
        if gov.public_satisfaction < 0.60:
            health_delta = 5000.0
            health_reasoning = "Public satisfaction dropped below 60%; allocating additional health funding."

        health_dec = HealthDecision(
            spending_delta=health_delta,
            reasoning_summary=health_reasoning,
        )

        # 3. Infrastructure Agent Decision
        infra_delta = 0.0
        infra_reasoning = "Infrastructure budget adequate."
        if macro.business_health < 0.70:
            infra_delta = 10000.0
            infra_reasoning = "Business health degraded (<70%); boosting infrastructure investment."

        infra_dec = InfrastructureDecision(
            spending_delta=infra_delta,
            reasoning_summary=infra_reasoning,
        )

        # 4. Central Bank Agent Decision
        rate_delta = 0.0
        bank_reasoning = "Monetary policy balanced."
        if bank.default_rate > 0.04:
            rate_delta = 0.0025
            bank_reasoning = "Loan default rate elevated (>4%); tightening credit conditions."
        elif bank.default_rate < 0.015 and cit.average_satisfaction > 0.70:
            rate_delta = -0.0025
            bank_reasoning = "Default risk low and satisfaction high; easing interest rates."

        bank_dec = BankDecision(
            interest_rate_delta=rate_delta,
            loan_decisions={},
            reasoning_summary=bank_reasoning,
        )

        # 5. Business Game Theory Moves (Prisoner's Dilemma)
        business_moves: Dict[str, BusinessMove] = {}
        for b in observation.businesses:
            move = "COOPERATE"
            reasoning = "Cooperative market stance."

            personality = (b.personality or "NEUTRAL").upper()
            last_rival_move = b.last_rival_move or "COOPERATE"

            if personality == "AGGRESSIVE":
                move = "DEFECT"
                reasoning = "Aggressive strategy seeking competitive market share."
            elif personality == "CONSERVATIVE":
                move = "COOPERATE"
                reasoning = "Conservative strategy minimizing market friction."
            elif personality == "INNOVATIVE":
                if last_rival_move == "DEFECT":
                    move = "DEFECT"
                    reasoning = "Grim Trigger activated following competitor defection."
                else:
                    move = "COOPERATE"
                    reasoning = "Innovative cooperative R&D alignment."
            else:  # NEUTRAL -> Tit-for-Tat
                move = last_rival_move
                reasoning = f"Tit-for-Tat strategy matching rival's move ({last_rival_move})."

            business_moves[b.id] = BusinessMove(
                move=move,
                rival_id=b.rival_id,
                reasoning_summary=reasoning,
            )

        # 6. Citizen Compliance Behavior
        trust = max(0.0, min(1.0, cit.average_trust))
        satisfaction = max(0.0, min(1.0, cit.average_satisfaction))
        tax_burden = max(0.0, min(1.0, cit.average_tax_burden))

        raw_compliance = 0.50 + 0.30 * trust + 0.15 * satisfaction - 0.25 * tax_burden
        compliance_rate = max(0.40, min(0.98, raw_compliance))

        citizen_beh = CitizenBehavior(compliance_rate=round(compliance_rate, 4))

        return AgentDecisionBundle(
            finance=finance_dec,
            health=health_dec,
            infrastructure=infra_dec,
            bank=bank_dec,
            business_decisions=business_moves,
            citizen_behavior=citizen_beh,
            strategic_state=StrategicState(policy_anchor_active=False),
            provider="mock",
        )

    async def decide(self, observation: AgentObservation) -> AgentDecisionBundle:
        return self.decide_sync(observation)

        gov = observation.government
        bank = observation.bank
        cit = observation.citizens_summary
        macro = observation.macro_metrics

        # 1. Finance Agent Decision
        tax_delta = 0.0
        finance_reasoning = "Fiscal policy stable."
        if gov.unemployment_rate > 0.08:
            tax_delta = -0.01
            finance_reasoning = "Unemployment elevated (>8%); applying modest tax relief."
        elif gov.treasury < 50000.0:
            tax_delta = 0.01
            finance_reasoning = "Treasury reserves low (<$50k); increasing tax rate slightly."
        elif gov.inflation_rate > 0.04:
            tax_delta = 0.01
            finance_reasoning = "Inflation high (>4%); tightening fiscal policy."

        finance_dec = FinanceDecision(
            tax_rate_delta=tax_delta,
            spending_allocation=SpendingAllocation(healthcare=0.35, infrastructure=0.40, reserve=0.25),
            reasoning_summary=finance_reasoning,
        )

        # 2. Health Agent Decision
        health_delta = 0.0
        health_reasoning = "Healthcare spending aligned with public health targets."
        if gov.public_satisfaction < 0.60:
            health_delta = 5000.0
            health_reasoning = "Public satisfaction dropped below 60%; allocating additional health funding."

        health_dec = HealthDecision(
            spending_delta=health_delta,
            reasoning_summary=health_reasoning,
        )

        # 3. Infrastructure Agent Decision
        infra_delta = 0.0
        infra_reasoning = "Infrastructure budget adequate."
        if macro.business_health < 0.70:
            infra_delta = 10000.0
            infra_reasoning = "Business health degraded (<70%); boosting infrastructure investment."

        infra_dec = InfrastructureDecision(
            spending_delta=infra_delta,
            reasoning_summary=infra_reasoning,
        )

        # 4. Central Bank Agent Decision
        rate_delta = 0.0
        bank_reasoning = "Monetary policy balanced."
        if bank.default_rate > 0.04:
            rate_delta = 0.0025
            bank_reasoning = "Loan default rate elevated (>4%); tightening credit conditions."
        elif bank.default_rate < 0.015 and cit.average_satisfaction > 0.70:
            rate_delta = -0.0025
            bank_reasoning = "Default risk low and satisfaction high; easing interest rates."

        bank_dec = BankDecision(
            interest_rate_delta=rate_delta,
            loan_decisions={},
            reasoning_summary=bank_reasoning,
        )

        # 5. Business Game Theory Moves (Prisoner's Dilemma)
        business_moves: Dict[str, BusinessMove] = {}
        for b in observation.businesses:
            move = "COOPERATE"
            reasoning = "Cooperative market stance."

            personality = (b.personality or "NEUTRAL").upper()
            last_rival_move = b.last_rival_move or "COOPERATE"

            if personality == "AGGRESSIVE":
                move = "DEFECT"
                reasoning = "Aggressive strategy seeking competitive market share."
            elif personality == "CONSERVATIVE":
                move = "COOPERATE"
                reasoning = "Conservative strategy minimizing market friction."
            elif personality == "INNOVATIVE":
                # Grim Trigger: if rival ever defected, defect
                if last_rival_move == "DEFECT":
                    move = "DEFECT"
                    reasoning = "Grim Trigger activated following competitor defection."
                else:
                    move = "COOPERATE"
                    reasoning = "Innovative cooperative R&D alignment."
            else:  # NEUTRAL -> Tit-for-Tat
                move = last_rival_move
                reasoning = f"Tit-for-Tat strategy matching rival's move ({last_rival_move})."

            business_moves[b.id] = BusinessMove(
                move=move,
                rival_id=b.rival_id,
                reasoning_summary=reasoning,
            )

        # 6. Citizen Compliance Behavior
        # Compliance influenced by trust, tax burden, and satisfaction
        trust = max(0.0, min(1.0, cit.average_trust))
        satisfaction = max(0.0, min(1.0, cit.average_satisfaction))
        tax_burden = max(0.0, min(1.0, cit.average_tax_burden))

        raw_compliance = 0.50 + 0.30 * trust + 0.15 * satisfaction - 0.25 * tax_burden
        compliance_rate = max(0.40, min(0.98, raw_compliance))

        citizen_beh = CitizenBehavior(compliance_rate=round(compliance_rate, 4))

        return AgentDecisionBundle(
            finance=finance_dec,
            health=health_dec,
            infrastructure=infra_dec,
            bank=bank_dec,
            business_decisions=business_moves,
            citizen_behavior=citizen_beh,
            strategic_state=StrategicState(policy_anchor_active=False),
            provider="mock",
        )


class SafeHoldDecisionProvider:
    """
    Fallback safety decision provider that returns zero-delta hold actions
    if the primary decision provider fails, times out, or returns invalid data.
    """

    async def decide(self, observation: AgentObservation) -> AgentDecisionBundle:
        return AgentDecisionBundle(
            finance=FinanceDecision(tax_rate_delta=0.0, reasoning_summary="Safe hold fallback active."),
            health=HealthDecision(spending_delta=0.0, reasoning_summary="Safe hold fallback active."),
            infrastructure=InfrastructureDecision(spending_delta=0.0, reasoning_summary="Safe hold fallback active."),
            bank=BankDecision(interest_rate_delta=0.0, reasoning_summary="Safe hold fallback active."),
            business_decisions={},
            citizen_behavior=CitizenBehavior(compliance_rate=0.85),
            strategic_state=StrategicState(policy_anchor_active=False),
            provider="safe_fallback",
        )
