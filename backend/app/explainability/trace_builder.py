from typing import Dict, Any, List
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.simulation import CausalEvent, AgentDecisionRecord, Snapshot, Simulation
from app.explainability.models import (
    TickExplainResponse,
    EntityExplainResponse,
    RangeExplainResponse,
    CausalChainSchema,
    CausalNodeSchema,
)


class TraceBuilder:
    """
    Helper service that queries stored CausalEvent and AgentDecision records
    from PostgreSQL and transforms them into structured CausalChain representations.
    """

    @staticmethod
    def get_tick_explanation(db: Session, simulation_id: UUID, tick: int) -> Dict[str, Any]:
        events = db.query(CausalEvent).filter(
            CausalEvent.simulation_id == simulation_id,
            CausalEvent.tick == tick
        ).order_by(CausalEvent.created_at.asc()).all()

        decisions = db.query(AgentDecisionRecord).filter(
            AgentDecisionRecord.simulation_id == simulation_id,
            AgentDecisionRecord.tick == tick
        ).all()

        snapshot = db.query(Snapshot).filter(
            Snapshot.simulation_id == simulation_id,
            Snapshot.tick == tick
        ).first()

        major_changes = []
        affected_entities = set()
        causal_chains = []

        # 1. Reconstruct main causal chain for the tick
        chain_nodes = []
        for idx, ev in enumerate(events):
            if ev.source_id:
                affected_entities.add(ev.source_id)
            if ev.target_id:
                affected_entities.add(ev.target_id)

            step_type = "OBSERVATION" if idx == 0 else "DIRECT_EFFECT" if idx == 1 else "SECONDARY_EFFECT"
            if ev.source_type in ["finance", "bank", "health", "infrastructure"]:
                step_type = "AGENT_DECISION"
            elif ev.cause_type == "policy_change" or ev.cause_type == "event_injection":
                step_type = "ACTION"

            chain_nodes.append(CausalNodeSchema(
                id=str(ev.id),
                type=step_type,
                label=ev.action,
                entity_id=ev.source_id,
                metric=ev.metric,
                before_value=ev.before_value,
                after_value=ev.after_value,
                delta=ev.delta,
                description=ev.description,
                confidence=ev.confidence
            ))
            major_changes.append(ev.description)

        if chain_nodes:
            causal_chains.append(CausalChainSchema(
                chain_id=f"chain_tick_{tick}",
                headline=f"Simulated Causal Propagation at Tick {tick}",
                steps=chain_nodes,
                primary_entity_ids=list(affected_entities)
            ))

        headline = events[0].description if events else f"Tick {tick} state simulation log."
        agent_dec_list = [
            {
                "agent_type": d.agent_type,
                "action_type": d.action_type,
                "reasoning_summary": d.reasoning_summary,
                "payload": d.decision_payload
            }
            for d in decisions
        ]

        return TickExplainResponse(
            simulation_id=str(simulation_id),
            tick=tick,
            headline=headline,
            major_changes=major_changes[:6],
            agent_decisions=agent_dec_list,
            causal_chains=causal_chains,
            affected_entities=list(affected_entities),
            model_assumptions_disclaimer="Simulated causal trace derived from authoritative model equations and persisted decisions."
        ).model_dump(mode="json")

    @staticmethod
    def get_entity_explanation(db: Session, simulation_id: UUID, tick: int, entity_id: str) -> Dict[str, Any]:
        events = db.query(CausalEvent).filter(
            CausalEvent.simulation_id == simulation_id,
            CausalEvent.tick == tick
        ).all()

        entity_events = [
            e for e in events
            if e.source_id == entity_id or e.target_id == entity_id or (e.metadata and entity_id in str(e.metadata))
        ]

        snapshot = db.query(Snapshot).filter(
            Snapshot.simulation_id == simulation_id,
            Snapshot.tick == tick
        ).first()

        entity_name = entity_id
        entity_type = "business" if "-" in entity_id else "government" if entity_id == "government" else "bank" if entity_id == "bank" else "citizen_group"
        deltas = {}

        if snapshot and isinstance(snapshot.state, dict):
            state = snapshot.state
            if entity_type == "business":
                biz_list = state.get("businesses", [])
                biz = next((b for b in biz_list if str(b.get("id")) == entity_id), None)
                if biz:
                    entity_name = biz.get("name", entity_id)
                    deltas = {
                        "revenue": biz.get("revenue"),
                        "profit": biz.get("profit"),
                        "health": biz.get("health"),
                        "employee_count": biz.get("employee_count"),
                        "capital": biz.get("capital", 50000.0),
                        "personality": biz.get("personality", "NEUTRAL"),
                        "last_game_move": biz.get("last_game_move", "COOPERATE")
                    }

        chain_nodes = []
        for idx, ev in enumerate(entity_events):
            chain_nodes.append(CausalNodeSchema(
                id=str(ev.id),
                type="DIRECT_EFFECT" if idx == 0 else "SECONDARY_EFFECT",
                label=ev.action,
                entity_id=entity_id,
                metric=ev.metric,
                before_value=ev.before_value,
                after_value=ev.after_value,
                delta=ev.delta,
                description=ev.description,
                confidence=ev.confidence
            ))

        causal_chain = CausalChainSchema(
            chain_id=f"chain_entity_{entity_id}_t{tick}",
            headline=f"Simulated Causal Trace for {entity_name} at Tick {tick}",
            steps=chain_nodes,
            primary_entity_ids=[entity_id]
        )

        headline = f"{entity_name} state evolution during Tick {tick} based on model equations."
        if entity_events:
            headline = entity_events[0].description

        return EntityExplainResponse(
            simulation_id=str(simulation_id),
            tick=tick,
            entity_id=entity_id,
            entity_name=entity_name,
            entity_type=entity_type,
            headline=headline,
            observed_deltas=deltas,
            causal_chains=[causal_chain] if chain_nodes else [],
            model_assumptions_disclaimer="Simulated causal trace derived from authoritative simulation engine state deltas."
        ).model_dump(mode="json")

    @staticmethod
    def get_range_explanation(db: Session, simulation_id: UUID, from_tick: int, to_tick: int) -> Dict[str, Any]:
        events = db.query(CausalEvent).filter(
            CausalEvent.simulation_id == simulation_id,
            CausalEvent.tick >= from_tick,
            CausalEvent.tick <= to_tick
        ).order_by(CausalEvent.tick.asc()).all()

        key_events = []
        most_affected = {}

        for ev in events:
            if ev.source_id:
                most_affected[ev.source_id] = most_affected.get(ev.source_id, 0) + 1
            key_events.append({
                "tick": ev.tick,
                "action": ev.action,
                "description": ev.description,
                "source_type": ev.source_type,
                "metric": ev.metric,
                "delta": ev.delta
            })

        sorted_affected = [
            {"entity_id": k, "event_count": v}
            for k, v in sorted(most_affected.items(), key=lambda item: item[1], reverse=True)
        ]

        headline = f"Multi-tick simulated causal trace from Tick {from_tick} to Tick {to_tick} ({len(events)} model events recorded)."

        return RangeExplainResponse(
            simulation_id=str(simulation_id),
            from_tick=from_tick,
            to_tick=to_tick,
            headline=headline,
            key_events=key_events[:15],
            most_affected_entities=sorted_affected[:5],
            model_assumptions_disclaimer="Simulated multi-tick causal trace across model state history."
        ).model_dump(mode="json")
