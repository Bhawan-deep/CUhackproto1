import uuid
from typing import Dict, Any, List, Optional


class CausalTraceBuilder:
    """
    Constructs structured CausalEvent records and compact causal summaries
    from empirical state deltas, agent decision records, and active interventions.
    """

    @staticmethod
    def build_trace(
        simulation_id: str,
        tick: int,
        pre_state: Dict[str, Any],
        post_state: Dict[str, Any],
        deltas: Dict[str, Any],
        decisions: List[Dict[str, Any]],
        intervention: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        causal_events = []
        affected_node_ids = set()
        active_paths = []
        major_changes = []
        headline = f"Tick {tick}: Normal economic equilibrium operations."

        macro_deltas = deltas.get("macro", {})
        gov_deltas = deltas.get("government", {})
        bank_deltas = deltas.get("bank", {})
        biz_deltas = deltas.get("businesses", {})
        citizen_deltas = deltas.get("citizens", {})

        # 1. User Intervention or External Shock Triggers
        if intervention:
            interv_name = intervention.get("type", "user_intervention")
            interv_desc = intervention.get("description", "User injected economic intervention")
            
            e_id = uuid.uuid4()
            causal_events.append({
                "id": e_id,
                "simulation_id": simulation_id,
                "tick": tick,
                "source_type": "user_intervention",
                "source_id": "user",
                "cause_type": "policy_change" if "policy" in interv_name.lower() else "event_injection",
                "action": interv_name,
                "target_type": "government" if "policy" in interv_name.lower() else "external_event",
                "target_id": "government" if "policy" in interv_name.lower() else None,
                "metric": "intervention_applied",
                "before_value": None,
                "after_value": None,
                "delta": None,
                "parent_event_id": None,
                "confidence": "deterministic",
                "description": interv_desc,
                "metadata": intervention
            })

            headline = f"Intervention applied: {interv_desc}"
            major_changes.append(f"⚡ User Intervention: {interv_name}")
            affected_node_ids.add("government")

        # 2. Agent Decisions (Finance, Health, Infrastructure, Central Bank)
        for dec in decisions:
            agent_type = dec.get("agent_type")
            action_type = dec.get("action_type")
            payload = dec.get("decision_payload", {})
            reasoning = dec.get("reasoning_summary", "")

            src_node = "bank" if agent_type == "bank" else "government"
            affected_node_ids.add(src_node)

            e_id = uuid.uuid4()
            causal_events.append({
                "id": e_id,
                "simulation_id": simulation_id,
                "tick": tick,
                "source_type": agent_type,
                "source_id": src_node,
                "cause_type": "agent_action",
                "action": action_type,
                "target_type": "government" if agent_type != "bank" else "bank",
                "target_id": src_node,
                "metric": action_type,
                "before_value": None,
                "after_value": None,
                "delta": None,
                "parent_event_id": None,
                "confidence": "deterministic",
                "description": f"{agent_type.upper()} Agent executed {action_type}: {reasoning}",
                "metadata": payload
            })

            major_changes.append(f"🧠 {agent_type.capitalize()} Agent: {action_type}")

        # 3. Central Bank Interest Rate Delta
        rate_delta = bank_deltas.get("interest_rate", {}).get("delta", 0.0)
        if abs(rate_delta) > 0.0001:
            rate_before = bank_deltas["interest_rate"]["before"]
            rate_after = bank_deltas["interest_rate"]["after"]
            affected_node_ids.add("bank")
            
            causal_events.append({
                "id": uuid.uuid4(),
                "simulation_id": simulation_id,
                "tick": tick,
                "source_type": "bank",
                "source_id": "bank",
                "cause_type": "market_force",
                "action": "adjust_interest_rate",
                "target_type": "business",
                "target_id": None,
                "metric": "interest_rate",
                "before_value": rate_before,
                "after_value": rate_after,
                "delta": rate_delta,
                "parent_event_id": None,
                "confidence": "deterministic",
                "description": f"Central Bank updated interest rate from {rate_before * 100:.1f}% to {rate_after * 100:.1f}%",
                "metadata": {}
            })
            major_changes.append(f"🏦 Central Bank rate adjusted ({rate_delta * 100:+.1f}%)")

        # 4. Business Level Deltas & Game Moves
        top_hiring = []
        top_firing = []
        significant_biz = []

        for b_id, b_info in biz_deltas.items():
            emp_delta = b_info["employee_count"]["delta"]
            rev_delta = b_info["revenue"]["delta"]
            health_delta = b_info["health"]["delta"]
            b_name = b_info["name"]

            if emp_delta != 0 or abs(rev_delta) > 1000.0 or abs(health_delta) > 0.05:
                affected_node_ids.add(b_id)
                significant_biz.append(b_id)

                if emp_delta > 0:
                    top_hiring.append(f"{b_name} (+{emp_delta})")
                elif emp_delta < 0:
                    top_firing.append(f"{b_name} ({emp_delta})")

                causal_events.append({
                    "id": uuid.uuid4(),
                    "simulation_id": simulation_id,
                    "tick": tick,
                    "source_type": "business",
                    "source_id": b_id,
                    "cause_type": "market_force",
                    "action": "workforce_adjustment" if emp_delta != 0 else "revenue_change",
                    "target_type": "citizen_group",
                    "target_id": None,
                    "metric": "revenue",
                    "before_value": b_info["revenue"]["before"],
                    "after_value": b_info["revenue"]["after"],
                    "delta": rev_delta,
                    "parent_event_id": None,
                    "confidence": "deterministic",
                    "description": f"{b_name} revenue shifted by ${rev_delta:,.2f} with workforce delta of {emp_delta}",
                    "metadata": b_info
                })

        if top_hiring:
            major_changes.append(f"💼 Hiring expanded at {', '.join(top_hiring[:2])}")
        if top_firing:
            major_changes.append(f"⚠ Staff cutbacks at {', '.join(top_firing[:2])}")

        # 5. Citizen Employment & Satisfaction Deltas
        emp_count_delta = citizen_deltas.get("employed_count", {}).get("delta", 0)
        sat_delta = citizen_deltas.get("average_satisfaction", {}).get("delta", 0.0)

        if emp_count_delta != 0 or abs(sat_delta) > 0.01:
            causal_events.append({
                "id": uuid.uuid4(),
                "simulation_id": simulation_id,
                "tick": tick,
                "source_type": "citizen_group",
                "source_id": "citizens_summary",
                "cause_type": "market_force",
                "action": "labor_market_reaction",
                "target_type": "macro_metrics",
                "target_id": "macro",
                "metric": "average_satisfaction",
                "before_value": citizen_deltas["average_satisfaction"]["before"],
                "after_value": citizen_deltas["average_satisfaction"]["after"],
                "delta": sat_delta,
                "parent_event_id": None,
                "confidence": "derived",
                "description": f"Citizen employment delta of {emp_count_delta} shifted public satisfaction by {sat_delta * 100:+.1f}%",
                "metadata": citizen_deltas
            })

        # Build active propagation paths e.g. ["government", "b_id", "group_id"]
        if "government" in affected_node_ids and significant_biz:
            for b_id in significant_biz[:3]:
                active_paths.append(["government", b_id])
        if "bank" in affected_node_ids and significant_biz:
            for b_id in significant_biz[:3]:
                active_paths.append(["bank", b_id])

        # Headline synthesis
        out_delta = macro_deltas.get("economic_output", {}).get("delta", 0.0)
        if not intervention and abs(out_delta) > 100000.0:
            direction = "expanded" if out_delta > 0 else "contracted"
            headline = f"Macro economic output {direction} by ${abs(out_delta):,.0f} during Tick {tick}."

        causal_summary = {
            "headline": headline,
            "major_changes": major_changes[:5],
            "affected_node_ids": list(affected_node_ids),
            "active_paths": active_paths
        }

        return {
            "events": causal_events,
            "summary": causal_summary
        }
