import asyncio
from starlette.testclient import TestClient

from app.main import app
from app.db.database import init_db, SessionLocal
from app.models.simulation import Simulation

init_db()


def run_timeline_automated_tests():
    print("==================================================")
    print("      PHASE 6 TIME MACHINE & TIMELINE TEST SUITE   ")
    print("==================================================")

    client = TestClient(app)

    # 1. Create Simulation with Seed 42
    res_create = client.post("/api/simulations", json={"name": "Timeline Replay Test Sim", "random_seed": 42})
    assert res_create.status_code == 201
    sim_id = res_create.json()["id"]
    print(f"[PASS] 1. Created Simulation ID: {sim_id}")

    # 2. Advance simulation to Tick 35 to test history at scale (30+ ticks)
    for _ in range(35):
        client.post(f"/api/simulations/{sim_id}/step")

    # Inject an event at tick 10 and update policy at tick 20
    client.post(f"/api/simulations/{sim_id}/events", json={"type": "recession", "severity": 0.7})
    client.put(f"/api/simulations/{sim_id}/policy", json={"tax_rate": 0.35, "infrastructure_spending": 120000.0})

    # Step 5 more times to Tick 40
    for _ in range(5):
        client.post(f"/api/simulations/{sim_id}/step")

    db = SessionLocal()
    sim_obj = db.query(Simulation).filter(Simulation.id == sim_id).first()
    authoritative_tick_before = sim_obj.current_tick
    db.close()
    assert authoritative_tick_before == 40
    print(f"[PASS] 2. Advanced Simulation to Month 40 at scale")

    # 3. GET /timeline -> Verify lightweight metadata and persisted intervention markers
    res_tl = client.get(f"/api/simulations/{sim_id}/timeline")
    assert res_tl.status_code == 200
    tl_data = res_tl.json()

    assert tl_data["current_tick"] == 40
    assert len(tl_data["snapshots"]) == 41 # Ticks 0..40
    assert "interventions" in tl_data
    assert len(tl_data["interventions"]) >= 2
    print(f"[PASS] 3. GET /timeline verified -> Ticks: {len(tl_data['snapshots'])}, Interventions: {len(tl_data['interventions'])}")

    # 4. GET /timeline with invalid simulation ID -> 404
    res_tl_err = client.get("/api/simulations/00000000-0000-0000-0000-000000000000/timeline")
    assert res_tl_err.status_code == 404
    print("[PASS] 4. GET /timeline for invalid simulation returned 404")

    # 5. GET /snapshots/10 -> Read historical world representation at Tick 10
    res_snap10 = client.get(f"/api/simulations/{sim_id}/snapshots/10")
    assert res_snap10.status_code == 200
    snap10 = res_snap10.json()

    assert "government" in snap10
    assert "businesses" in snap10
    assert "citizen_groups" in snap10
    assert len(snap10["businesses"]) == 12
    assert len(snap10["citizen_groups"]) == 10
    print(f"[PASS] 5. GET /snapshots/10 verified -> Government, 12 Businesses, 10 Citizen Groups")

    # 6. GET /snapshots/25 -> Read historical world representation at Tick 25
    res_snap25 = client.get(f"/api/simulations/{sim_id}/snapshots/25")
    assert res_snap25.status_code == 200
    snap25 = res_snap25.json()

    # Verify stable business UUIDs between Tick 10 and Tick 25
    biz10_ids = [b["id"] for b in snap10["businesses"]]
    biz25_ids = [b["id"] for b in snap25["businesses"]]
    assert biz10_ids == biz25_ids
    print(f"[PASS] 6. Stable Business UUIDs verified across historical snapshots (M10 == M25)")

    # 7. GET /snapshots/999 -> Nonexistent tick returns 404
    res_snap_err = client.get(f"/api/simulations/{sim_id}/snapshots/999")
    assert res_snap_err.status_code == 404
    print("[PASS] 7. GET /snapshots/999 for nonexistent tick returned 404")

    # 8. STRICT READ-ONLY INVARIANT: Verify authoritative current_tick did NOT mutate
    db = SessionLocal()
    sim_obj_after = db.query(Simulation).filter(Simulation.id == sim_id).first()
    authoritative_tick_after = sim_obj_after.current_tick
    db.close()

    assert authoritative_tick_before == authoritative_tick_after == 40
    print(f"[PASS] 8. READ-ONLY INVARIANT VERIFIED -> Authoritative Tick before ({authoritative_tick_before}) == Authoritative Tick after ({authoritative_tick_after})")

    # 9. RESET clears timeline history back to Tick 0
    res_reset = client.post(f"/api/simulations/{sim_id}/reset")
    assert res_reset.status_code == 200

    res_tl_reset = client.get(f"/api/simulations/{sim_id}/timeline")
    assert res_tl_reset.status_code == 200
    tl_reset_data = res_tl_reset.json()

    assert tl_reset_data["current_tick"] == 0
    assert len(tl_reset_data["snapshots"]) == 1 # Only Tick 0 remains
    assert len(tl_reset_data["interventions"]) == 0
    print("[PASS] 9. RESET cleared old timeline history and restored fresh Tick 0 snapshot")

    print("\nAll Phase 6 Time Machine & Timeline automated tests passed successfully!\n")


if __name__ == "__main__":
    run_timeline_automated_tests()
