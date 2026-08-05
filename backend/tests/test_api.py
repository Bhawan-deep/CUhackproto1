import sys
from uuid import uuid4
from fastapi.testclient import TestClient

from app.main import app
from app.db.database import init_db, SessionLocal
from app.models.simulation import Simulation, Citizen, Business, GovernmentState, Snapshot

# Initialize DB tables
init_db()

client = TestClient(app)


def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "simulation-api"}
    print("[PASS] GET /api/health")


def test_phase_2_api_and_db_persistence():
    print("\n--- Testing Phase 2 API Endpoints & Database Persistence ---")
    db = SessionLocal()
    try:
        # 1. Create Simulation
        res_create = client.post("/api/simulations", json={"name": "Phase 2 Demo Economy", "random_seed": 42})
        assert res_create.status_code == 201
        sim_id = res_create.json()["id"]
        print(f"[PASS] Created Simulation Record ID: {sim_id}")

        # 2. Call POST /step (First step: initializes Tick 0 snapshot, executes step 1, persists Tick 1 snapshot)
        res_step1 = client.post(f"/api/simulations/{sim_id}/step")
        assert res_step1.status_code == 200
        step1_data = res_step1.json()
        assert step1_data["tick"] == 1
        assert step1_data["summary"]["total_citizens"] == 100
        assert step1_data["summary"]["business_count"] == 12
        print(f"[PASS] Step 1 executed cleanly. Tick = {step1_data['tick']}")

        # 3. Verify Database Records in PostgreSQL
        sim_row = db.query(Simulation).filter(Simulation.id == sim_id).first()
        assert sim_row.current_tick == 1

        citizen_count = db.query(Citizen).filter(Citizen.simulation_id == sim_id).count()
        assert citizen_count == 100, f"Expected 100 citizens, got {citizen_count}"

        business_count = db.query(Business).filter(Business.simulation_id == sim_id).count()
        assert business_count == 12, f"Expected 12 businesses, got {business_count}"

        gov_count = db.query(GovernmentState).filter(GovernmentState.simulation_id == sim_id).count()
        assert gov_count == 1, f"Expected 1 government record, got {gov_count}"

        snap_0 = db.query(Snapshot).filter(Snapshot.simulation_id == sim_id, Snapshot.tick == 0).first()
        assert snap_0 is not None, "Snapshot for Tick 0 must exist"

        snap_1 = db.query(Snapshot).filter(Snapshot.simulation_id == sim_id, Snapshot.tick == 1).first()
        assert snap_1 is not None, "Snapshot for Tick 1 must exist"
        print("[PASS] PostgreSQL persistence verified: 100 citizens, 12 businesses, 1 gov, Snapshot 0 & 1 exist!")

        # 4. GET /metrics
        res_metrics = client.get(f"/api/simulations/{sim_id}/metrics")
        assert res_metrics.status_code == 200
        metrics = res_metrics.json()
        assert "employment_rate" in metrics
        assert "inequality" in metrics
        print("[PASS] GET /api/simulations/{id}/metrics")

        # 5. GET /policy & PUT /policy
        res_policy_get = client.get(f"/api/simulations/{sim_id}/policy")
        assert res_policy_get.status_code == 200
        assert res_policy_get.json()["tax_rate"] == 0.20

        res_policy_put = client.put(
            f"/api/simulations/{sim_id}/policy",
            json={"tax_rate": 0.25, "infrastructure_spending": 75000.0}
        )
        assert res_policy_put.status_code == 200
        assert res_policy_put.json()["tax_rate"] == 0.25
        assert res_policy_put.json()["infrastructure_spending"] == 75000.0
        print("[PASS] GET & PUT /api/simulations/{id}/policy")

        # 6. POST /events
        res_event = client.post(
            f"/api/simulations/{sim_id}/events",
            json={"type": "recession", "severity": 0.7}
        )
        assert res_event.status_code == 201
        assert res_event.json()["event_type"] == "recession"
        print("[PASS] POST /api/simulations/{id}/events")

        # 7. Call POST /step again (Tick 2: verifies state reuse without re-generating citizens)
        res_step2 = client.post(f"/api/simulations/{sim_id}/step")
        assert res_step2.status_code == 200
        step2_data = res_step2.json()
        assert step2_data["tick"] == 2

        # Verify citizen count remains 100 in DB
        citizen_count_step2 = db.query(Citizen).filter(Citizen.simulation_id == sim_id).count()
        assert citizen_count_step2 == 100, f"Citizens must NOT be regenerated on step 2, expected 100, got {citizen_count_step2}"
        print("[PASS] Step 2 executed. State reused cleanly from DB without citizen regeneration.")

        # 8. Test Invalid Validations
        # Invalid tax rate (>0.60)
        res_bad_tax = client.put(f"/api/simulations/{sim_id}/policy", json={"tax_rate": 0.85})
        assert res_bad_tax.status_code == 422
        print("[PASS] Invalid tax rate (>0.60) rejected with 422")

        # Invalid event type
        res_bad_event = client.post(f"/api/simulations/{sim_id}/events", json={"type": "supernova", "severity": 0.5})
        assert res_bad_event.status_code == 400
        print("[PASS] Invalid event type rejected with 400")

        # Missing simulation ID (404)
        missing_uuid = str(uuid4())
        res_missing = client.post(f"/api/simulations/{missing_uuid}/step")
        assert res_missing.status_code == 404
        print("[PASS] Missing simulation ID returned 404")

    finally:
        db.close()


if __name__ == "__main__":
    test_health()
    test_phase_2_api_and_db_persistence()
    print("\nAll Phase 2 API tests passed successfully!")
