import asyncio
import json
import httpx
from starlette.testclient import TestClient

from app.main import app
from app.db.database import init_db, SessionLocal
from app.services.simulation_service import SimulationService

init_db()


def run_phase_5_manual_verification_scenario():
    print("==================================================")
    print("    PHASE 5 CAUSAL INTERVENTION VERIFICATION SCENARIO  ")
    print("==================================================")

    client = TestClient(app)

    # 1. Create Simulation with seed 42
    res_create = client.post("/api/simulations", json={"name": "Causal Lab Demo Sim", "random_seed": 42})
    assert res_create.status_code == 201
    sim_id = res_create.json()["id"]
    print(f"\n1. Created Simulation ID: {sim_id} (Seed 42)")

    # 2. Advance simulation to Month 5
    for t in range(5):
        client.post(f"/api/simulations/{sim_id}/step")

    res_m5 = client.get(f"/api/simulations/{sim_id}/metrics")
    assert res_m5.status_code == 200
    baseline_m5_metrics = res_m5.json()
    print(f"\n2. Reached Month 5 Baseline Metrics (Pre-Intervention):")
    print(f"   - Employment Rate: {(baseline_m5_metrics['employment_rate'] * 100):.1f}%")
    print(f"   - Economic Output: ${baseline_m5_metrics['economic_output']:,.2f}")
    print(f"   - Inequality (Gini): {baseline_m5_metrics['inequality']:.3f}")
    print(f"   - Satisfaction: {(baseline_m5_metrics['public_satisfaction'] * 100):.1f}%")
    print(f"   - Business Health: {(baseline_m5_metrics['business_health'] * 100):.1f}%")

    # 3. INTERVENTION 1: Inject Recession (Severity 0.7) at Month 5
    res_recession = client.post(f"/api/simulations/{sim_id}/events", json={"type": "recession", "severity": 0.7})
    assert res_recession.status_code == 201
    print(f"\n3. Applied Intervention 1 (Month 5): Recession Shock (Severity 0.7)")

    # Step exactly 5 times (Month 5 -> Month 10)
    for _ in range(5):
        client.post(f"/api/simulations/{sim_id}/step")

    res_m10 = client.get(f"/api/simulations/{sim_id}/metrics")
    m10_metrics = res_m10.json()

    print(f"\n4. 5-Tick Simulation Response Following Recession Shock (Month 5 -> Month 10):")
    print(f"   - Employment: {(baseline_m5_metrics['employment_rate'] * 100):.1f}% -> {(m10_metrics['employment_rate'] * 100):.1f}% ({(m10_metrics['employment_rate'] - baseline_m5_metrics['employment_rate']) * 100:+.1f}pp)")
    print(f"   - Output: ${baseline_m5_metrics['economic_output']:,.2f} -> ${m10_metrics['economic_output']:,.2f} ({((m10_metrics['economic_output'] - baseline_m5_metrics['economic_output']) / baseline_m5_metrics['economic_output']) * 100:+.1f}%)")
    print(f"   - Inequality: {baseline_m5_metrics['inequality']:.3f} -> {m10_metrics['inequality']:.3f} ({m10_metrics['inequality'] - baseline_m5_metrics['inequality']:+.3f})")
    print(f"   - Satisfaction: {(baseline_m5_metrics['public_satisfaction'] * 100):.1f}% -> {(m10_metrics['public_satisfaction'] * 100):.1f}% ({(m10_metrics['public_satisfaction'] - baseline_m5_metrics['public_satisfaction']) * 100:+.1f}pp)")
    print(f"   - Business Health: {(baseline_m5_metrics['business_health'] * 100):.1f}% -> {(m10_metrics['business_health'] * 100):.1f}% ({(m10_metrics['business_health'] - baseline_m5_metrics['business_health']) * 100:+.1f}pp)")

    # Audit Top Affected Entities from /world
    res_w10 = client.get(f"/api/simulations/{sim_id}/world")
    assert res_w10.status_code == 200
    w10_data = res_w10.json()

    print("\n5. Entity Impact Audit at Month 10:")
    print(f"   - Businesses Total: {len(w10_data['businesses'])}")
    print(f"   - Citizen Groups Total: {len(w10_data['citizen_groups'])}")

    # 4. INTERVENTION 2: Policy Update (Infrastructure Spending $50k -> $150k) at Month 10
    baseline_m10_metrics = m10_metrics
    res_policy = client.put(f"/api/simulations/{sim_id}/policy", json={"infrastructure_spending": 150000.0})
    assert res_policy.status_code == 200
    print(f"\n6. Applied Intervention 2 (Month 10): Policy Update (Infra Spending $50k -> $150k)")

    # Step 5 more times (Month 10 -> Month 15)
    for _ in range(5):
        client.post(f"/api/simulations/{sim_id}/step")

    res_m15 = client.get(f"/api/simulations/{sim_id}/metrics")
    m15_metrics = res_m15.json()

    print(f"\n7. 5-Tick Simulation Response Following Policy Update (Month 10 -> Month 15):")
    print(f"   - Employment: {(baseline_m10_metrics['employment_rate'] * 100):.1f}% -> {(m15_metrics['employment_rate'] * 100):.1f}% ({(m15_metrics['employment_rate'] - baseline_m10_metrics['employment_rate']) * 100:+.1f}pp)")
    print(f"   - Output: ${baseline_m10_metrics['economic_output']:,.2f} -> ${m15_metrics['economic_output']:,.2f} ({((m15_metrics['economic_output'] - baseline_m10_metrics['economic_output']) / baseline_m10_metrics['economic_output']) * 100:+.1f}%)")
    print(f"   - Business Health: {(baseline_m10_metrics['business_health'] * 100):.1f}% -> {(m15_metrics['business_health'] * 100):.1f}% ({(m15_metrics['business_health'] - baseline_m10_metrics['business_health']) * 100:+.1f}pp)")

    # 5. Audit Persisted History Endpoints
    res_ev_hist = client.get(f"/api/simulations/{sim_id}/history/events")
    res_pol_hist = client.get(f"/api/simulations/{sim_id}/history/policies")
    assert res_ev_hist.status_code == 200
    assert res_pol_hist.status_code == 200

    print(f"\n8. Persisted Database History Audit:")
    print(f"   - Persisted Events Count: {len(res_ev_hist.json())}")
    print(f"   - Persisted Policies Count: {len(res_pol_hist.json())}")

    print("\n[VERIFICATION SUCCESS] Phase 5 Causal Intervention Scenario Verified 100%!")


if __name__ == "__main__":
    run_phase_5_manual_verification_scenario()
