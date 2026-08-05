import json
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.db.database import init_db, SessionLocal
from app.models.simulation import Simulation, Citizen, Business, GovernmentState, Snapshot, SimulationEvent

init_db()
client = TestClient(app)


def run_phase_2_manual_verification():
    print("==================================================")
    print("   PHASE 2 MANUAL INTEGRATION VERIFICATION SCENARIO")
    print("==================================================")

    # 1. Create Simulation with Seed 42
    res_create = client.post("/api/simulations", json={"name": "Integration Test Economy", "random_seed": 42})
    assert res_create.status_code == 201
    sim_data = res_create.json()
    sim_id = sim_data["id"]
    print(f"\n1. Created Simulation ID: {sim_id}")
    print(f"   Tick: {sim_data['current_tick']} | Status: {sim_data['status']} | Seed: {sim_data['random_seed']}")

    # 2. Call /step -> Tick 1
    res_step1 = client.post(f"/api/simulations/{sim_id}/step")
    assert res_step1.status_code == 200
    step1 = res_step1.json()
    print(f"\n2. Executed /step -> Tick: {step1['tick']}")
    print(f"   Metrics Tick 1: Employment Rate={step1['metrics']['employment_rate']}, Output={step1['metrics']['economic_output']}, Gini Inequality={step1['metrics']['inequality']}, Satisfaction={step1['metrics']['public_satisfaction']}, Biz Health={step1['metrics']['business_health']}")

    # 3. Call /step -> Tick 2
    res_step2 = client.post(f"/api/simulations/{sim_id}/step")
    assert res_step2.status_code == 200
    step2 = res_step2.json()
    print(f"\n3. Executed /step -> Tick: {step2['tick']}")

    # 4. Update Policy (tax_rate = 0.25, infrastructure_spending = 75000.0)
    res_policy = client.put(f"/api/simulations/{sim_id}/policy", json={"tax_rate": 0.25, "infrastructure_spending": 75000.0})
    assert res_policy.status_code == 200
    print(f"\n4. Updated Policy: Tax Rate={res_policy.json()['tax_rate']}, Infra Spending={res_policy.json()['infrastructure_spending']}")

    # 5. Call /step -> Tick 3 (Verify policy is active)
    res_step3 = client.post(f"/api/simulations/{sim_id}/step")
    assert res_step3.status_code == 200
    step3 = res_step3.json()
    print(f"\n5. Executed /step -> Tick: {step3['tick']}")
    print(f"   Active Policy in Step 3: Tax Rate={step3['policy']['tax_rate']}, Infra Spending={step3['policy']['infrastructure_spending']}")
    assert step3["policy"]["tax_rate"] == 0.25

    # 6. Inject Event: Recession severity 0.7
    res_event = client.post(f"/api/simulations/{sim_id}/events", json={"type": "recession", "severity": 0.7})
    assert res_event.status_code == 201
    print(f"\n6. Injected Event: Type={res_event.json()['event_type']}, Severity={res_event.json()['severity']}")

    # 7. Call /step several times (Tick 4, Tick 5)
    res_step4 = client.post(f"/api/simulations/{sim_id}/step")
    res_step5 = client.post(f"/api/simulations/{sim_id}/step")
    step5 = res_step5.json()
    print(f"\n7. Executed /step -> Tick: {step5['tick']}")
    print(f"   Active Events count: {len(step5['active_events'])}")
    print(f"   Metrics Tick 5: Employment Rate={step5['metrics']['employment_rate']}, Output={step5['metrics']['economic_output']}, Gini Inequality={step5['metrics']['inequality']}, Satisfaction={step5['metrics']['public_satisfaction']}, Biz Health={step5['metrics']['business_health']}")

    # 8. PostgreSQL Database Audit
    db = SessionLocal()
    try:
        sim_row = db.query(Simulation).filter(Simulation.id == sim_id).first()
        citizens_count = db.query(Citizen).filter(Citizen.simulation_id == sim_id).count()
        businesses_count = db.query(Business).filter(Business.simulation_id == sim_id).count()
        gov_count = db.query(GovernmentState).filter(GovernmentState.simulation_id == sim_id).count()
        snapshots = db.query(Snapshot).filter(Snapshot.simulation_id == sim_id).order_by(Snapshot.tick).all()
        snapshot_ticks = [s.tick for s in snapshots]

        print("\n8. PostgreSQL Audit:")
        print(f"   - Simulation current_tick in DB: {sim_row.current_tick}")
        print(f"   - Persistent Citizens count: {citizens_count} (Expected: 100)")
        print(f"   - Persistent Businesses count: {businesses_count} (Expected: 12)")
        print(f"   - Government State count: {gov_count} (Expected: 1)")
        print(f"   - Snapshots in DB: Ticks {snapshot_ticks} (Expected: [0, 1, 2, 3, 4, 5])")

        assert sim_row.current_tick == 5
        assert citizens_count == 100
        assert businesses_count == 12
        assert gov_count == 1
        assert snapshot_ticks == [0, 1, 2, 3, 4, 5]
        print("\n[VERIFICATION SUCCESS] All Phase 2 criteria verified against PostgreSQL!")

    finally:
        db.close()


if __name__ == "__main__":
    run_phase_2_manual_verification()
