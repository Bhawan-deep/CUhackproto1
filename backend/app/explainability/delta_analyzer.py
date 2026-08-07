from typing import Dict, Any, List


class DeltaAnalyzer:
    """
    Analyzes pre-state and post-state snapshots exported by the simulation engine
    to extract actual, empirical deltas across all economic entities and macro metrics.
    """

    @staticmethod
    def analyze(pre_state: Dict[str, Any], post_state: Dict[str, Any]) -> Dict[str, Any]:
        pre_metrics = pre_state.get("metrics", {})
        post_metrics = post_state.get("metrics", {})

        # Macro deltas
        macro_deltas = {}
        for k in ["economic_output", "employment_rate", "inequality", "public_satisfaction", "business_health"]:
            v_before = float(pre_metrics.get(k, 0.0))
            v_after = float(post_metrics.get(k, 0.0))
            macro_deltas[k] = {
                "before": v_before,
                "after": v_after,
                "delta": round(v_after - v_before, 4)
            }

        # Government deltas
        pre_gov = pre_state.get("government", {})
        post_gov = post_state.get("government", {})
        gov_deltas = {}
        for k in ["treasury", "tax_rate", "infrastructure_spending", "healthcare_spending"]:
            v_before = float(pre_gov.get(k, 0.0))
            v_after = float(post_gov.get(k, 0.0))
            gov_deltas[k] = {
                "before": v_before,
                "after": v_after,
                "delta": round(v_after - v_before, 4)
            }

        # Bank deltas
        pre_bank = pre_state.get("bank", {})
        post_bank = post_state.get("bank", {})
        bank_deltas = {}
        for k in ["interest_rate", "reserves", "default_rate"]:
            v_before = float(pre_bank.get(k, 0.0))
            v_after = float(post_bank.get(k, 0.0))
            bank_deltas[k] = {
                "before": v_before,
                "after": v_after,
                "delta": round(v_after - v_before, 4)
            }

        # Business deltas
        pre_biz_map = {str(b["id"]): b for b in pre_state.get("businesses", [])}
        post_biz_map = {str(b["id"]): b for b in post_state.get("businesses", [])}
        biz_deltas = {}

        for b_id, post_b in post_biz_map.items():
            pre_b = pre_biz_map.get(b_id, {})
            b_name = post_b.get("name", f"Business_{b_id}")
            b_industry = post_b.get("industry", "Unknown")

            biz_deltas[b_id] = {
                "id": b_id,
                "name": b_name,
                "industry": b_industry,
                "revenue": {
                    "before": float(pre_b.get("revenue", 0.0)),
                    "after": float(post_b.get("revenue", 0.0)),
                    "delta": round(float(post_b.get("revenue", 0.0)) - float(pre_b.get("revenue", 0.0)), 2)
                },
                "profit": {
                    "before": float(pre_b.get("profit", 0.0)),
                    "after": float(post_b.get("profit", 0.0)),
                    "delta": round(float(post_b.get("profit", 0.0)) - float(pre_b.get("profit", 0.0)), 2)
                },
                "capital": {
                    "before": float(pre_b.get("capital", 50000.0)),
                    "after": float(post_b.get("capital", 50000.0)),
                    "delta": round(float(post_b.get("capital", 50000.0)) - float(pre_b.get("capital", 50000.0)), 2)
                },
                "employee_count": {
                    "before": int(pre_b.get("employee_count", 0)),
                    "after": int(post_b.get("employee_count", 0)),
                    "delta": int(post_b.get("employee_count", 0)) - int(pre_b.get("employee_count", 0))
                },
                "health": {
                    "before": float(pre_b.get("health", 1.0)),
                    "after": float(post_b.get("health", 1.0)),
                    "delta": round(float(post_b.get("health", 1.0)) - float(pre_b.get("health", 1.0)), 4)
                },
                "last_game_move": post_b.get("last_game_move", "COOPERATE")
            }

        # Citizen summary / group deltas
        pre_cits = pre_state.get("citizens", [])
        post_cits = post_state.get("citizens", [])
        pre_emp = sum(1 for c in pre_cits if c.get("employed"))
        post_emp = sum(1 for c in post_cits if c.get("employed"))
        pre_wealth = sum(c.get("wealth", 0.0) for c in pre_cits) / float(len(pre_cits) or 1)
        post_wealth = sum(c.get("wealth", 0.0) for c in post_cits) / float(len(post_cits) or 1)
        pre_satisfaction = sum(c.get("satisfaction", 0.7) for c in pre_cits) / float(len(pre_cits) or 1)
        post_satisfaction = sum(c.get("satisfaction", 0.7) for c in post_cits) / float(len(post_cits) or 1)

        citizen_deltas = {
            "employed_count": {"before": pre_emp, "after": post_emp, "delta": post_emp - pre_emp},
            "average_wealth": {"before": round(pre_wealth, 2), "after": round(post_wealth, 2), "delta": round(post_wealth - pre_wealth, 2)},
            "average_satisfaction": {"before": round(pre_satisfaction, 4), "after": round(post_satisfaction, 4), "delta": round(post_satisfaction - pre_satisfaction, 4)},
        }

        return {
            "macro": macro_deltas,
            "government": gov_deltas,
            "bank": bank_deltas,
            "businesses": biz_deltas,
            "citizens": citizen_deltas,
        }
